package filestorage

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/grafana/grafana/pkg/services/sqlstore"
)

// run with GRAFANA_TEST_DB=mysql
func TestLeak(t *testing.T) {
	fmt.Println("start")

	ctx := context.Background()
	db := sqlstore.InitTestDB(t)

	fmt.Println("queriers")
	for querier := 0; querier < 5; querier++ {
		go func(db *sqlstore.SQLStore) {
			for {
				_ = db.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {

					query, err := sess.Query("select version()")

					if err != nil {
						fmt.Println("query error " + err.Error())
						return err
					}

					fmt.Println(string(query[0]["version()"]))

					query, err = sess.Query("select count(*) from server_lock")

					if err != nil {
						fmt.Println("query error " + err.Error())
						return err
					}

					fmt.Println(string(query[0]["count(*)"]))

					query, err = sess.Query("SELECT distinct operation_uid from server_lock")

					if err != nil {
						fmt.Println("query error " + err.Error())
						return err
					}

					if len(query) > 0 {
						fmt.Println(string(query[0]["operation_uid"]))
					}
					return nil
				})

				time.Sleep(50 * time.Millisecond)
			}
		}(db)
	}

	fmt.Println("upserters")
	for upserter := 0; upserter < 10; upserter++ {
		go func(db *sqlstore.SQLStore) {
			for {
				_ = db.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
					fieldNames := []string{
						"id", "operation_uid", "version", "last_execution",
					}
					maxRows := 20
					bigUpsertSQL, err := db.Dialect.UpsertMultipleSQL(
						"server_lock", fieldNames, fieldNames, maxRows)

					sessDb := sess.DB()
					stmt, err := sessDb.Prepare(bigUpsertSQL)
					//defer stmt.Close()

					if err != nil {
						fmt.Println("preparing error " + err.Error())
						fmt.Println(bigUpsertSQL)
						return err
					}

					values := make([]interface{}, 0)
					for i := 0; i < maxRows; i++ {
						newId, _ := uuid.NewRandom()

						values = append(values, nil)
						values = append(values, newId)
						values = append(values, 4)
						values = append(values, time.Now().Unix())
					}

					_, err = stmt.ExecContext(ctx, values...)
					if err != nil {
						fmt.Println("err execing " + err.Error())
						return err
					}

					//lastInsertId, _ := res.LastInsertId()
					//rowsAffected, _ := res.RowsAffected()

					//fmt.Println(fmt.Sprintf("lastInsertedId:%d, rowsAffected:%d", lastInsertId, rowsAffected))

					bigUpsertSQL2, err := db.Dialect.UpsertMultipleSQL(
						"server_lock", fieldNames, fieldNames, maxRows)

					stmt2, err := sessDb.Prepare(bigUpsertSQL2)
					//defer stmt.Close()

					if err != nil {
						fmt.Println("preparing error " + err.Error())
						fmt.Println(bigUpsertSQL)
						return err
					}

					values2 := make([]interface{}, 0)
					for i := 0; i < maxRows; i++ {
						newId, err := uuid.NewRandom()
						if err != nil {
							return err
						}

						values2 = append(values2, nil)
						values2 = append(values2, newId.String())
						values2 = append(values2, 4)
						values2 = append(values2, time.Now().Unix())
					}

					_, err = stmt2.ExecContext(ctx, values2...)
					if err != nil {
						fmt.Println("err execing " + err.Error())
						return err
					}

					//lastInsertId, _ = res.LastInsertId()
					//rowsAffected, _ = res.RowsAffected()
					//fmt.Println(fmt.Sprintf("exec2: lastInsertedId:%d, rowsAffected:%d", lastInsertId, rowsAffected))

					return nil
				})

				time.Sleep(5 * time.Millisecond)
			}
		}(db)
	}

	go func(db *sqlstore.SQLStore) {
		for {
			_ = db.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {

				db := sess.DB()
				stmt, err := db.Prepare("delete from server_lock")
				//defer stmt.Close()
				if err != nil {
					fmt.Println("preparing error " + err.Error())
					return err
				}

				res, err := stmt.ExecContext(ctx)
				if err != nil {
					fmt.Println("err execing " + err.Error())
					return err
				}

				lastInsertId, _ := res.LastInsertId()
				rowsAffected, _ := res.RowsAffected()

				fmt.Println(fmt.Sprintf("DELETED: lastInsertedId:%d, rowsAffected:%d", lastInsertId, rowsAffected))
				return nil
			})

			time.Sleep(30 * time.Second)
		}
	}(db)

	select {
	case <-ctx.Done():
	}

}
