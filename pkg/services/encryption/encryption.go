package encryption

import "github.com/grafana/grafana/pkg/components/securejsondata"

type Service interface {
	Encrypt([]byte, string) ([]byte, error)
	Decrypt([]byte, string) ([]byte, error)

	GetEncryptedJsonData(map[string]string) (securejsondata.SecureJsonData, error)
}
