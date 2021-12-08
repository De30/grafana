package experiments

import (
	"context"
	"io/ioutil"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/contexthandler"
	"github.com/grafana/grafana/pkg/web"
	"github.com/opentracing/opentracing-go"

	"github.com/fsnotify/fsnotify"
	"github.com/google/cel-go/cel"
	"github.com/google/cel-go/checker/decls"
	"github.com/google/cel-go/common/types"
	"github.com/grafana/grafana/pkg/setting"
	ol "github.com/opentracing/opentracing-go/log"
	"gopkg.in/yaml.v2"
)

var (
	experimentsHeaderName = "x-experiments"
)

func ProvideService(cfg *setting.Cfg) (*ExperimentsService, error) {
	s := &ExperimentsService{
		Cfg:      cfg,
		log:      log.New("experiments"),
		filename: "conf/experiments/default.yaml",
		exps:     make(map[string]Experiment),
		defaults: make(map[string]Experiment),
	}
	exps, err := readExperiments(s.filename)
	if err != nil {
		return nil, err
	}

	s.AddExperiment(Experiment{
		Name:        "feature1",
		Description: "feature1",
		Expression:  "true",
	})

	s.AddExperiment(Experiment{
		Name:        "feature2",
		Description: "feature2",
		Expression:  "true",
	})

	// add default experiments
	for k, v := range s.defaults {
		s.exps[k] = v
	}

	// override with exps from config
	for _, e := range exps {
		s.exps[e.Name] = e
	}
	// compile the expressions
	s.compile()

	return s, nil
}

type ExperimentsService struct {
	log      log.Logger
	Cfg      *setting.Cfg
	exps     map[string]Experiment
	defaults map[string]Experiment
	filename string
	progs    map[string]cel.Program
}

func (srv *ExperimentsService) Run(ctx context.Context) error {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}
	defer watcher.Close()

	if err := watcher.Add(srv.filename); err != nil {
		return err
	}

	for {
		select {
		// watch for events
		case event := <-watcher.Events:
			exps, err := readExperiments(srv.filename)
			if err != nil {
				srv.log.Error("failed to read experiments file", "event", event, "error", err)
			} else {
				srv.log.Info("reloading experiments file", "path", srv.filename)
				newExps := make(map[string]Experiment)

				// add default experiments
				for k, v := range srv.defaults {
					newExps[k] = v
				}

				// override with exps from config
				for _, e := range exps {
					newExps[e.Name] = e
				}

				srv.exps = newExps
				srv.compile()
			}
		case err := <-watcher.Errors:
			srv.log.Error("failed to watch experiments file", "error", err)
		case <-ctx.Done():
			return ctx.Err()
		}
	}
}

func (srv *ExperimentsService) compile() {
	progs := make(map[string]cel.Program)

	// TODO: how/where to declare supported variables?
	d := cel.Declarations(
		decls.NewVar("userid", decls.Int),
		decls.NewVar("grafana-version", decls.String),
		decls.NewVar("browser-user-agent", decls.String),
		decls.NewVar("locale", decls.String),
	)
	// Create a standard environment
	env, err := cel.NewEnv(d)
	if err != nil {
		srv.log.Error("environment creation error", "error", err)
		return
	}

	for _, exp := range srv.exps {
		// Check the expression for syntactic errors
		ast, iss := env.Parse(exp.Expression)
		if iss.Err() != nil {
			srv.log.Error("expression parsing error", "name", exp.Name, "expression", exp.Expression, "error", iss.Err())
			continue
		}
		// Type-check the expression for correctness
		checked, iss := env.Check(ast)
		if iss.Err() != nil {
			srv.log.Error("expression type-checking error", "name", exp.Name, "expression", exp.Expression, "error", iss.Err())
			continue
		}
		// Check the result type is a string
		if checked.ResultType() != decls.Bool {
			srv.log.Error("expression should return a boolean", "name", exp.Name, "expression", exp.Expression, "got", checked.ResultType())
			continue
		}
		// Plan the program
		prg, err := env.Program(ast)
		if err != nil {
			srv.log.Error("failed to generate program", "name", exp.Name, "expression", exp.Expression, "error", iss.Err())
			continue
		}
		progs[exp.Name] = prg
	}
	srv.progs = progs
}

type Experiment struct {
	Name        string `yaml:"name"`
	Description string `yaml:"description"`
	Expression  string `yaml:"expression"`
}

func (srv *ExperimentsService) IsEnabled(ctx context.Context, name string) bool {
	// loop over config items
	_, exist := srv.progs[name]
	if exist {
		// evaludate the expression
		// TODO: extract the variables from context
		attributes := ctx.Value(experimentAttributeContextKey{})
		out, _, err := (srv.progs[name]).Eval(attributes)
		if err != nil {
			srv.log.Error("expression evaluation error", "name", name, "error", err)
		}
		res := out == types.True
		srv.log.Debug("IsEnabled", "name", name, "attributes", attributes, "res", res)
		return res
	}
	srv.log.Debug("experiment not found", "name", name)
	return false
}

func (srv *ExperimentsService) AddExperiment(exp Experiment) {
	srv.defaults[exp.Name] = exp
}

func (srv *ExperimentsService) ListOfExperiments(ctx context.Context) map[string]bool {
	result := map[string]bool{}
	for _, e := range srv.exps {
		result[e.Name] = srv.IsEnabled(ctx, e.Name)
	}

	return result
}

func readExperiments(filename string) ([]Experiment, error) {
	exps := []Experiment{}

	yamlFile, err := ioutil.ReadFile(filename)
	if err != nil {
		return []Experiment{}, err
	}

	err = yaml.Unmarshal(yamlFile, &exps)
	if err != nil {
		return []Experiment{}, err
	}

	return exps, nil
}

// // this could be a regexp but I'm lazy
// func extractKV(input string) map[string]bool {
// 	res := map[string]bool{}

// 	tags := strings.Split(input, ",")
// 	for _, v := range tags {
// 		kv := strings.Split(v, "=")
// 		if len(kv) > 1 {
// 			// TODO(Carl Bergquist): decide how to handle this error
// 			boolValue, _ := strconv.ParseBool(kv[1])
// 			res[kv[0]] = boolValue
// 		}
// 	}

// 	return res
// }

type experimentAttributeContextKey struct{}

type experimentsContextKey struct{}

func GetExperiments(ctx context.Context) map[string]bool {
	ctxValue := ctx.Value(experimentsContextKey{})

	value, ok := ctxValue.(map[string]bool)
	if ok {
		return value
	}

	return map[string]bool{}
}

func (srv *ExperimentsService) Middleware(mContext *web.Context) {
	span, _ := opentracing.StartSpanFromContext(mContext.Req.Context(), "Experiments - Middleware")
	defer span.Finish()

	ctx := mContext.Req.Context()

	reqContext := contexthandler.FromContext(ctx)

	attributes := map[string]interface{}{}
	attributes["userid"] = reqContext.UserId
	attributes["grafana-version"] = srv.Cfg.BuildVersion
	attributes["browser-user-agent"] = mContext.Req.UserAgent()
	attributes["locale"] = mContext.Req.Header.Get("Accept-Language")

	ctx = context.WithValue(ctx, experimentAttributeContextKey{}, attributes)

	exps := srv.ListOfExperiments(ctx)

	mContext.Req = mContext.Req.WithContext(context.WithValue(ctx, experimentsContextKey{}, exps))
	mContext.Map(mContext.Req)

	traceFields := make([]ol.Field, 0)
	for k, v := range exps {
		traceFields = append(traceFields, ol.Bool(k, v))
	}

	span.LogFields(traceFields...)
}
