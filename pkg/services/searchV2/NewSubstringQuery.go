package searchV2

import (
	"strings"

	"github.com/blugelabs/bluge/search"
	"github.com/blugelabs/bluge/search/searcher"
	"github.com/blugelabs/bluge/search/similarity"
)

type boost float64

func (b *boost) Value() float64 {
	if b == nil {
		return 1
	}
	return float64(*b)
}

type SubstringQuery struct {
	substring string
	field     string
	boost     *boost
	scorer    search.Scorer
}

func NewSubstringQuery(substring string) *SubstringQuery {
	return &SubstringQuery{
		substring: strings.ToLower(substring),
	}
}

func (q *SubstringQuery) Substring() string {
	return q.substring
}

func (q *SubstringQuery) SetBoost(b float64) *SubstringQuery {
	boostVal := boost(b)
	q.boost = &boostVal
	return q
}

func (q *SubstringQuery) Boost() float64 {
	return q.boost.Value()
}

func (q *SubstringQuery) SetField(f string) *SubstringQuery {
	q.field = f
	return q
}

func (q *SubstringQuery) Field() string {
	return q.field
}

func (q *SubstringQuery) Searcher(i search.Reader, options search.SearcherOptions) (search.Searcher, error) {
	field := q.field
	if q.field == "" {
		field = options.DefaultSearchField
	}

	return newSubstringSearcher(
		i,
		q.substring,
		field,
		q.boost.Value(),
		q.scorer,
		similarity.NewCompositeSumScorer(),
		options,
	)
}

func newSubstringSearcher(indexReader search.Reader, substring, field string,
	boost float64, scorer search.Scorer, compScorer search.CompositeScorer,
	options search.SearcherOptions) (search.Searcher, error) {

	var empty []byte // no prefix or suffix
	fieldDict, err := indexReader.DictionaryIterator(field, nil, empty, empty)
	if err != nil {
		return nil, err
	}

	defer func() {
		if cerr := fieldDict.Close(); cerr != nil && err == nil {
			err = cerr
		}
	}()

	var candidateTerms []string

	tfd, err := fieldDict.Next()

	for err == nil && tfd != nil {
		term := tfd.Term()
		if strings.Contains(term, substring) {
			candidateTerms = append(candidateTerms, term)
		}
		tfd, err = fieldDict.Next()
	}
	if err != nil {
		return nil, err
	}

	return searcher.NewMultiTermSearcher(indexReader, candidateTerms, field, boost, scorer,
		compScorer, options, true)
}

func (q *SubstringQuery) Validate() error {
	return nil // real validation delayed until searcher constructor
}
