package channels

import "fmt"

type Channel struct {
	Type        string
	Name        string
	Desc        string
	ImplFactory func(FactoryConfig) (NotificationChannel, error)
	Options     []NotifierOption
}

func (c Channel) SettingsHeader() string {
	return fmt.Sprintf("%s settings", c.Name)
}

type NotifierOption struct {
}
