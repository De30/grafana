package searchV2

import (
	"strings"

	"github.com/blugelabs/bluge/search"
	"github.com/blugelabs/bluge/search/searcher"
	"github.com/blugelabs/bluge/search/similarity"
)

type NameContainsQuery struct {
	term      string
	fieldName string
}

func NewNameContainsQuery(term string, fieldName string) *NameContainsQuery {
	return &NameContainsQuery{
		term:      strings.ToLower(term),
		fieldName: fieldName,
	}
}

func (c NameContainsQuery) Searcher(i search.Reader, options search.SearcherOptions) (search.Searcher, error) {
	s, err := searcher.NewMatchAllSearcher(i, 1, similarity.ConstantScorer(1), options)
	if err != nil {
		return nil, err
	}
	return searcher.NewFilteringSearcher(s, func(d *search.DocumentMatch) bool {
		var name string
		err = d.VisitStoredFields(func(field string, value []byte) bool {
			if field == c.fieldName {
				name = strings.ToLower(string(value))
				return false
			}
			return true
		})
		return strings.Contains(name, c.term)
	}), err
}
