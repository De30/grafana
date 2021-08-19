package util

import (
	"errors"

	"github.com/grafana/grafana/pkg/services/sqlstore"
)

var ErrNotInitialized = errors.New("function is not initialized")

type EncryptionOptions struct {
	Scope     string
	DBSession *sqlstore.DBSession
}

type EncryptionOption func(*EncryptionOptions)

// WithScope uses a data key for encryption bound to some specific scope (i.e., user, org, etc.).
// Scope should look like "user:10", "org:1".
func WithScope(scope string) EncryptionOption {
	return func(opts *EncryptionOptions) {
		opts.Scope = scope
	}
}

// WithoutScope uses a root level data key for encryption (DEK),
// in other words this DEK is not bound to any specific scope (not attached to any user, org, etc.).
func WithoutScope() EncryptionOption {
	return func(opts *EncryptionOptions) {
		opts.Scope = "root"
	}
}

func WithDBSession(sess *sqlstore.DBSession) EncryptionOption {
	return func(opts *EncryptionOptions) {
		opts.DBSession = sess
	}
}

// Decrypt decrypts a payload with a given secret.
// ALERT: This method interacts with the database, so
// you should not be used within a database transactions.
var Decrypt = func(_ []byte) ([]byte, error) {
	return nil, ErrNotInitialized
}

// Encrypt encrypts a payload with a given secret.
// ALERT: This method interacts with the database, so
// you should not be used within a database transactions.
var Encrypt = func(_ []byte, opts ...EncryptionOption) ([]byte, error) {
	return nil, ErrNotInitialized
}
