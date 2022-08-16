package outgoingevents

type Event string

const (
	EventIncidentCreated         Event = "incident.created"
	EventIncidentResolved              = "incident.resolved"
	EventIncidentSeverityChanged       = "incident.severityChanged"
)
