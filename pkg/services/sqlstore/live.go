package sqlstore

import (
	"fmt"
	"time"

	"github.com/grafana/grafana/pkg/models"
)

func (ss *SQLStore) SaveLiveChannelData(query *models.SaveLiveChannelDataQuery) error {
	return inTransaction(func(sess *DBSession) error {
		var msg models.LiveChannel
		exists, err := x.NoAutoCondition(true).Where("org_id=? AND channel=?", query.OrgId, query.Channel).Get(&msg)
		if err != nil {
			return fmt.Errorf("error getting existing: %w", err)
		}
		if !exists {
			msg = models.LiveChannel{
				OrgId:   query.OrgId,
				Channel: query.Channel,
				Data:    query.Data,
				Config: models.LiveChannelConfig{
					Type: "test",
				},
				Created: time.Now(),
			}
			_, err := sess.Insert(&msg)
			if err != nil {
				return fmt.Errorf("error inserting: %w", err)
			}
			return nil
		}
		msg.Data = query.Data
		msg.Created = time.Now()
		_, err = sess.ID(msg.Id).AllCols().Update(&msg)
		if err != nil {
			return fmt.Errorf("error updating: %w", err)
		}
		return nil
	})
}

func (ss *SQLStore) GetLiveChannel(query *models.GetLiveChannelQuery) (models.LiveChannel, bool, error) {
	var msg models.LiveChannel
	// Using Where without NoAutoCondition(true) we get the following SQL:
	// SELECT `id`, `org_id`, `channel`, `data`, `config`, `created` FROM `live_channel` WHERE (org_id=? AND channel=?) AND `config`=? LIMIT 1 []interface {}{1, "grafana/broadcast/xxx", "{}"}
	exists, err := x.NoAutoCondition(true).Where("org_id=? AND channel=?", query.OrgId, query.Channel).Get(&msg)
	if err != nil {
		return models.LiveChannel{}, false, err
	}
	return msg, exists, nil
}
