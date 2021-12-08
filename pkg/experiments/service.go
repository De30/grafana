package experiments

import (
	"context"
	"io/ioutil"

	"github.com/grafana/grafana/pkg/infra/log"

	"github.com/fsnotify/fsnotify"
	"github.com/grafana/grafana/pkg/setting"
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
	}

	exps, err := readExperiments(s.filename)
	if err != nil {
		return nil, err
	}

	for _, e := range exps {
		s.exps[e.Name] = e
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

	return s, nil
}

type ExperimentsService struct {
	log      log.Logger
	Cfg      *setting.Cfg
	exps     map[string]Experiment
	filename string
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
				// TODO: need a lock to avoid breaking experiments while reloading
				srv.log.Info("reloading experiments file", "path", srv.filename)
				srv.exps = make(map[string]Experiment)
				for _, e := range exps {
					srv.exps[e.Name] = e
				}
			}
		case err := <-watcher.Errors:
			srv.log.Error("failed to watch experiments file", "error", err)
		case <-ctx.Done():
			{
				return ctx.Err()
			}
		}
	}

	return nil
}

type Experiment struct {
	Name        string `yaml:"name"`
	Description string `yaml:"description"`
	Expression  string `yaml:"expression"`
}

func (srv *ExperimentsService) IsEnabled(ctx context.Context, name string) bool {
	// loop over config items
	_, exist := srv.exps[name]
	if exist {
		return srv.exps[name].Expression == "true"
	}

	return false
}

func (srv *ExperimentsService) AddExperiment(exp Experiment) {
	// deal with the error
	_, exist := srv.exps[exp.Name]
	if !exist {
		srv.exps[exp.Name] = exp
	}
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

// func Experiments(cfg *setting.Cfg) web.Handler {
// 	return func(next http.Handler) http.Handler {
// 		return http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
// 			headerValues := req.Header.Get(experimentsHeaderName)

// 			if headerValues == "" {
// 				next.ServeHTTP(rw, req)
// 				return
// 			}

// 			exps := extractKV(headerValues)

// 			ctxWithExps := context.WithValue(req.Context(), "experiments", exps)
// 			req = req.WithContext(ctxWithExps)

// 			next.ServeHTTP(rw, req)
// 		})
// 	}
// }
