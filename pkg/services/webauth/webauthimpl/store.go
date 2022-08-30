package webauthimpl

import (
	"context"
	"errors"
	"time"

	"github.com/duo-labs/webauthn/webauthn"
	"github.com/grafana/grafana/pkg/services/sqlstore"
	"github.com/grafana/grafana/pkg/services/sqlstore/db"

	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/services/webauth"
)

type store interface {
	AddCredential(context.Context, int64, ...*webauth.Credential) ([]webauth.WebauthnCredential, error)
	GetCredentials(context.Context, int64) ([]webauth.Credential, error)
	UpdateSignCount(context.Context, int64, uint32) error
	DeleteCredential(context.Context, int64) error
	CredentialExists(context.Context, []byte) (bool, error)
}

type sqlStore struct {
	db db.DB
}

func (ss *sqlStore) AddCredential(ctx context.Context, userID int64, credentials ...*webauth.Credential) ([]webauth.WebauthnCredential, error) {
	credRows := make([]webauth.WebauthnCredential, len(credentials))
	err := ss.db.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		usr := &user.User{ID: userID}
		if _, err := sess.Get(usr); err != nil {
			return err
		}

		for i, cred := range credentials {
			properCred := webauth.WebauthnCredential{
				CredentialID:    cred.ID,
				Name:            cred.Name,
				UserID:          userID,
				PublicKey:       cred.PublicKey,
				AttestationType: cred.AttestationType,
				Aaguid:          cred.Authenticator.AAGUID,
				SignCount:       cred.Authenticator.SignCount,
				CloneWarning:    cred.Authenticator.CloneWarning,
				Created:         time.Now(),
			}

			credRows[i] = properCred

			// InsertMulti doesn't update autoincr columns in an orm struct unfortunately
			// so we're inserting one-by-one here
			if _, err := sess.Insert(properCred); err != nil {
				return err
			}
		}

		return nil
	})

	return credRows, err
}

func (ss *sqlStore) GetCredentials(ctx context.Context, userID int64) ([]webauth.Credential, error) {
	var creds []webauth.Credential
	err := ss.db.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		usr := &user.User{ID: userID}
		_, err := sess.Get(usr)
		if err != nil {
			return err
		}

		var credentials []webauth.WebauthnCredential
		err = sess.Where("user_id=?", userID).Find(&credentials)
		if err != nil {
			return err
		}

		creds = make([]webauth.Credential, len(credentials))
		for i, curCredential := range credentials {
			creds[i] = webauth.Credential{
				Name:       curCredential.Name,
				LocalID:    curCredential.ID,
				UserHandle: usr.WebauthnHandle,
				Created:    curCredential.Created,
				Credential: &webauthn.Credential{
					ID:              curCredential.CredentialID,
					PublicKey:       curCredential.PublicKey,
					AttestationType: curCredential.AttestationType,
					Authenticator: webauthn.Authenticator{
						AAGUID:       curCredential.Aaguid,
						SignCount:    curCredential.SignCount,
						CloneWarning: curCredential.CloneWarning,
					},
				},
			}
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return creds, nil
}

func (ss *sqlStore) UpdateSignCount(ctx context.Context, ID int64, newSignCount uint32) error {
	return ss.db.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		_, err := sess.Update(&webauth.WebauthnCredential{ID: ID, SignCount: newSignCount})
		return err
	})
}

func (ss *sqlStore) DeleteCredential(ctx context.Context, ID int64) error {
	return ss.db.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		cred := webauth.WebauthnCredential{ID: ID}
		if _, err := sess.Get(&cred); err != nil {
			return err
		}

		credCount, err := sess.Count(webauth.WebauthnCredential{UserID: cred.UserID})
		if err != nil {
			return err
		}

		usr := user.User{ID: cred.UserID}
		if _, err = sess.Get(&usr); err != nil {
			return err
		}

		if credCount <= 1 && len(usr.Password) == 0 {
			return errors.New("user with no password must have at least one credential")
		}

		_, err = sess.Delete(webauth.WebauthnCredential{ID: ID})
		return err
	})
}

func (ss *sqlStore) CredentialExists(ctx context.Context, ID []byte) (bool, error) {
	var exists bool
	var err error
	err = ss.db.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		exists, err = sess.Exist(&webauth.WebauthnCredential{CredentialID: ID})
		return err
	})

	return exists, err
}
