package outgoingevents

import "time"

type Event string

const (
	EventIncidentCreated         Event = "incident.created"
	EventIncidentResolved              = "incident.resolved"
	EventIncidentSeverityChanged       = "incident.severityChanged"
)

// EventHandler refers to a script or webhook that should be used for
// handling an event.
type EventHandler struct {
	ID     int64  `xorm:"pk autoincr 'id'" json:"id"`
	UserID int64  `xorm:"user_id"`
	Name   string `xorm:"name"`

	// Event is the event name to handle.
	Event Event `xorm:"event" json:"event"`

	// Source is the source code of the handler to run in our scripts
	// runner.
	Source []byte `xorm:"source" json:"source,omitempty"`

	// Language is the language of the script.
	Language string `orm:"lang" json:"lang,omitempty"`

	// WebhookURL is the URL of an external webhook.
	WebhookURL string `xorm:"webhook_url" json:"webhook_url,omitempty"`

	Created time.Time
	Updated time.Time
}

func (h EventHandler) IsScript() bool  { return len(h.Source) > 0 && h.Language != "" }
func (h EventHandler) IsWebhook() bool { return h.WebhookURL != "" }
func (h EventHandler) IsValid() bool   { return h.IsScript() != h.IsWebhook() }
