package migrator

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestPostgresSerialColumnTranslation(t *testing.T) {
	tests := []struct {
		column       Column
		expectedType string
	}{
		{
			Column{
				Type:            DB_SmallInt,
				IsAutoIncrement: true,
			},
			DB_Serial,
		},
		{
			Column{
				Type:            DB_MediumInt,
				IsAutoIncrement: true,
			},
			DB_Serial,
		},
		{
			Column{
				Type:            DB_Int,
				IsAutoIncrement: true,
			},
			DB_Serial,
		},
		{
			Column{
				Type:            DB_Integer,
				IsAutoIncrement: true,
			},
			DB_Serial,
		},
		{
			Column{
				Type:            DB_BigInt,
				IsAutoIncrement: true,
			},
			DB_BigSerial,
		},
	}

	for _, test := range tests {
		t.Run(fmt.Sprintf("%v should return %v", test.column, test.expectedType), func(t *testing.T) {
			db := &PostgresDialect{}

			typ := db.SQLType(&test.column)
			assert.Equal(t, test.expectedType, typ)
		})
	}
}
