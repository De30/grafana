package defaultprovider

import (
	"context"

	"github.com/grafana/grafana/pkg/services/encryption"
	"github.com/grafana/grafana/pkg/services/secrets"
	"github.com/grafana/grafana/pkg/setting"
)

type grafanaProvider struct {
	cfg        *setting.Cfg
	encryption encryption.Internal
}

func New(cfg *setting.Cfg, encryption encryption.Internal) secrets.Provider {
	return grafanaProvider{
		encryption: encryption,
	}
}

func (p grafanaProvider) Encrypt(ctx context.Context, blob []byte) ([]byte, error) {
	key := p.cfg.SecretKey
	return p.encryption.Encrypt(ctx, blob, key)
}

func (p grafanaProvider) Decrypt(ctx context.Context, blob []byte) ([]byte, error) {
	key := p.cfg.SecretKey
	return p.encryption.Decrypt(ctx, blob, key)
}
