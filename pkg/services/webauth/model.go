package webauth

import (
	"encoding/binary"
	"errors"
	"time"

	"github.com/duo-labs/webauthn/webauthn"
)

// Typed errors
var (
	ErrCaseInsensitive     = errors.New("case insensitive conflict")
	ErrUserNotFound        = errors.New("user not found")
	ErrUserAlreadyExists   = errors.New("user already exists")
	ErrLastGrafanaAdmin    = errors.New("cannot remove last grafana admin")
	ErrProtectedUser       = errors.New("cannot adopt protected user")
	ErrNoUniqueID          = errors.New("identifying id not found")
	ErrMarshal             = errors.New("could not marshal JSON")
	ErrCredentialsNotFound = errors.New("credentials not found")
)

type WebauthnCredential struct {
	ID              int64 `xorm:"pk autoincr 'id'"`
	Name            string
	CredentialID    []byte `xorm:"credential_id"`
	UserID          int64  `xorm:"user_id"`
	PublicKey       []byte
	AttestationType string
	Aaguid          []byte
	SignCount       uint32
	CloneWarning    bool
	Created         time.Time
}

type User struct {
	UserHandle  int64
	UserId      int64
	Name        string
	Email       string
	Credentials []webauthn.Credential
}

type CreationOptions struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

func (c *CreationOptions) NameOrFallback() string {
	if c.Name != "" {
		return c.Name
	}
	return c.Email
}

func (user *User) WebAuthnID() []byte {
	b := make([]byte, 8)
	binary.LittleEndian.PutUint64(b, uint64(user.UserHandle))
	return b
}

func (user *User) WebAuthnName() string {
	return user.Email
}

func (user *User) WebAuthnDisplayName() string {
	return user.Name
}

func (user *User) WebAuthnIcon() string {
	return ""
}

func (user *User) WebAuthnCredentials() []webauthn.Credential {
	return user.Credentials
}

// type SeshStore struct {
// 	*session.Store
// }

// type SessionData struct {
// 	*webauthn.SessionData
// 	Name  string `json:"name,omitempty"`
// 	Email string `json:"email"`
// }

// key given the request and responsewriter
// func (store *SeshStore) SaveWebauthnSession(key string, data *SessionData, r *http.Request, w http.ResponseWriter) error {
// 	marshaledData, err := json.Marshal(data)
// 	if err != nil {
// 		return err
// 	}
// 	return store.Set(key, marshaledData, r, w)
// }

// GetWebauthnSession unmarshals and returns the webauthn session information
// from the session cookie.
// func (store *SeshStore) GetWebauthnSession(key string, r *http.Request) (SessionData, error) {
// 	sessionData := SessionData{}
// 	session, err := store.Get(r, session.WebauthnSession)
// 	if err != nil {
// 		return sessionData, err
// 	}
// 	assertion, ok := session.Values[key].([]byte)
// 	if !ok {
// 		return sessionData, ErrMarshal
// 	}
// 	err = json.Unmarshal(assertion, &sessionData)
// 	if err != nil {
// 		return sessionData, err
// 	}
// 	// Delete the value from the session now that it's been read
// 	delete(session.Values, key)
// 	return sessionData, nil
// }

// func NewStore(keyPairs ...[]byte) (*SeshStore, error) {
// 	newStore, err := session.NewStore(keyPairs...)
// 	if err != nil {
// 		return nil, err
// 	}
// 	store := &SeshStore{
// 		newStore,
// 	}
// 	return store, nil
// }
