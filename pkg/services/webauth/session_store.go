package webauth

import (
	"errors"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/duo-labs/webauthn/webauthn"
	"github.com/grafana/grafana/pkg/middleware/cookies"
	"github.com/grafana/grafana/pkg/models"
)

type SessionStore struct {
	keyVals map[string]*webauthn.SessionData
	timeout time.Duration
	mutex   sync.Mutex
}

const SessionCookieName = "webauthn-session"

var (
	ErrSessionNotFound = errors.New("session data not found")
)

func NewSessionStore(timeout time.Duration) *SessionStore {
	return &SessionStore{
		keyVals: make(map[string]*webauthn.SessionData),
		timeout: timeout,
	}
}

func (store *SessionStore) Set(w http.ResponseWriter, key string, sessionData *webauthn.SessionData) {
	store.mutex.Lock()
	store.keyVals[key] = sessionData
	cookies.WriteCookie(w, SessionCookieName, fmt.Sprint(key), int(store.timeout.Seconds()), nil)
	store.mutex.Unlock()

	go func() {
		time.Sleep(store.timeout)
		store.mutex.Lock()
		delete(store.keyVals, key)
		store.mutex.Unlock()
	}()
}

func (store *SessionStore) Get(ctx *models.ReqContext) (*webauthn.SessionData, error) {
	store.mutex.Lock()
	defer store.mutex.Unlock()

	cookie, err := ctx.Req.Cookie(SessionCookieName)
	if err != nil {
		return nil, err
	}

	key := cookie.Value

	sessionData, ok := store.keyVals[key]
	if sessionData == nil || !ok {
		return nil, ErrSessionNotFound
	}

	delete(store.keyVals, key)
	cookies.DeleteCookie(ctx.Resp, SessionCookieName, nil)

	return sessionData, nil
}
