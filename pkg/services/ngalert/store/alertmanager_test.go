package store

import (
	"context"
	"crypto/md5"
	"fmt"
	"sort"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/infra/db"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/ngalert/models"
)

func TestIntegrationAlertmanagerStore(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}
	sqlStore := db.InitTestDB(t)
	store := &DBstore{
		SQLStore: sqlStore,
		Logger:   log.NewNopLogger(),
	}

	t.Run("GetLatestAlertmanagerConfiguration for org that doesn't exist returns error", func(t *testing.T) {
		_, _ = setupConfig(t, "my-config", store)
		req := &models.GetLatestAlertmanagerConfigurationQuery{
			OrgID: 1234,
		}

		err := store.GetLatestAlertmanagerConfiguration(context.Background(), req)

		require.ErrorIs(t, err, ErrNoAlertmanagerConfiguration)
		require.Nil(t, req.Result)
	})

	t.Run("GetLatestAlertmanagerConfiguration return the right config", func(t *testing.T) {
		_, configMD5 := setupConfig(t, "my-config", store)
		req := &models.GetLatestAlertmanagerConfigurationQuery{
			OrgID: 1,
		}

		err := store.GetLatestAlertmanagerConfiguration(context.Background(), req)

		require.NoError(t, err)
		require.NotNil(t, req.Result)
		require.Equal(t, "my-config", req.Result.AlertmanagerConfiguration)
		require.Equal(t, configMD5, req.Result.ConfigurationHash)
	})

	t.Run("GetLatestAlertmanagerConfiguration after saving multiple times should return the latest config", func(t *testing.T) {
		_, _ = setupConfig(t, "my-config1", store)
		_, _ = setupConfig(t, "my-config2", store)
		_, configMD5 := setupConfig(t, "my-config3", store)
		req := &models.GetLatestAlertmanagerConfigurationQuery{
			OrgID: 1,
		}

		err := store.GetLatestAlertmanagerConfiguration(context.Background(), req)

		require.NoError(t, err)
		require.NotNil(t, req.Result)
		require.Equal(t, "my-config3", req.Result.AlertmanagerConfiguration)
		require.Equal(t, configMD5, req.Result.ConfigurationHash)
	})

	t.Run("GetAllLatestAlertmanagerConfiguration gets latest config for all orgs", func(t *testing.T) {
		_, _ = setupConfigInOrg(t, "my-config1", 1, store)
		_, _ = setupConfigInOrg(t, "my-config2", 1, store)
		_, _ = setupConfigInOrg(t, "my-config3", 1, store)
		_, _ = setupConfigInOrg(t, "my-config1", 2, store)
		_, _ = setupConfigInOrg(t, "my-config1", 3, store)

		res, err := store.GetAllLatestAlertmanagerConfiguration(context.Background())

		require.NoError(t, err)
		require.Len(t, res, 3)
		sort.Slice(res, func(i, j int) bool {
			return res[i].OrgID < res[j].OrgID
		})
		require.Equal(t, int64(1), res[0].OrgID)
		require.Equal(t, int64(2), res[1].OrgID)
		require.Equal(t, int64(3), res[2].OrgID)
		require.Equal(t, "my-config3", res[0].AlertmanagerConfiguration)
		require.Equal(t, "my-config1", res[1].AlertmanagerConfiguration)
		require.Equal(t, "my-config1", res[2].AlertmanagerConfiguration)
	})

	t.Run("SaveAlertmanagerConfigurationWithCallback calls callback", func(t *testing.T) {
		called := false
		callback := func() error { called = true; return nil }
		cmd := buildSaveConfigCmd(t, "my-config", 1)

		err := store.SaveAlertmanagerConfigurationWithCallback(context.Background(), &cmd, callback)

		require.NoError(t, err)
		require.True(t, called)
	})

	t.Run("SaveAlertmanagerConfigurationWithCallback rolls back if callback returns error", func(t *testing.T) {
		_, _ = setupConfigInOrg(t, "my-config", 1, store)
		callback := func() error { return fmt.Errorf("callback failed") }
		cmd := buildSaveConfigCmd(t, "my-config-changed", 1)

		err := store.SaveAlertmanagerConfigurationWithCallback(context.Background(), &cmd, callback)

		require.ErrorContains(t, err, "callback failed")
		// Assert that we rolled back the transaction.
		get := &models.GetLatestAlertmanagerConfigurationQuery{OrgID: 1}
		err = store.GetLatestAlertmanagerConfiguration(context.Background(), get)
		require.NoError(t, err)
		require.Equal(t, get.Result.AlertmanagerConfiguration, "my-config")
	})

	t.Run("SaveAlertmanagerConfigurationWithCallback saves the hash of the created record in the cmd", func(t *testing.T) {
		_, _ = setupConfigInOrg(t, "my-config", 1, store)
		callback := func() error { return nil }
		cmd := buildSaveConfigCmd(t, "my-config-changed", 1)

		err := store.SaveAlertmanagerConfigurationWithCallback(context.Background(), &cmd, callback)

		require.NoError(t, err)
		require.NotZero(t, cmd.ResultHash)
		get := &models.GetLatestAlertmanagerConfigurationQuery{OrgID: 1}
		err = store.GetLatestAlertmanagerConfiguration(context.Background(), get)
		require.NoError(t, err)
		require.Equal(t, cmd.ResultHash, get.Result.ConfigurationHash)
	})

	t.Run("UpdateAlertmanagerConfiguration returns error if existing config does not exist", func(t *testing.T) {
		cmd := buildSaveConfigCmd(t, "my-config", 1234)
		cmd.FetchedConfigurationHash = fmt.Sprintf("%x", md5.Sum([]byte("my-config")))
		err := store.UpdateAlertmanagerConfiguration(context.Background(), &cmd)

		require.ErrorIs(t, err, ErrVersionLockedObjectNotFound)
	})
}

func TestIntegrationAlertmanagerHash(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}
	sqlStore := db.InitTestDB(t)
	store := &DBstore{
		SQLStore: sqlStore,
		Logger:   log.NewNopLogger(),
	}

	t.Run("When passing the right hash the config should be updated", func(t *testing.T) {
		_, configMD5 := setupConfig(t, "my-config", store)
		req := &models.GetLatestAlertmanagerConfigurationQuery{
			OrgID: 1,
		}
		err := store.GetLatestAlertmanagerConfiguration(context.Background(), req)
		require.NoError(t, err)
		require.Equal(t, configMD5, req.Result.ConfigurationHash)
		newConfig, newConfigMD5 := "my-config-new", fmt.Sprintf("%x", md5.Sum([]byte("my-config-new")))
		err = store.UpdateAlertmanagerConfiguration(context.Background(), &models.SaveAlertmanagerConfigurationCmd{
			AlertmanagerConfiguration: newConfig,
			FetchedConfigurationHash:  configMD5,
			ConfigurationVersion:      "v1",
			Default:                   false,
			OrgID:                     1,
		})
		require.NoError(t, err)
		err = store.GetLatestAlertmanagerConfiguration(context.Background(), req)
		require.NoError(t, err)
		require.Equal(t, newConfig, req.Result.AlertmanagerConfiguration)
		require.Equal(t, newConfigMD5, req.Result.ConfigurationHash)
	})

	t.Run("When passing the wrong hash the update should error", func(t *testing.T) {
		config, configMD5 := setupConfig(t, "my-config", store)
		req := &models.GetLatestAlertmanagerConfigurationQuery{
			OrgID: 1,
		}
		err := store.GetLatestAlertmanagerConfiguration(context.Background(), req)
		require.NoError(t, err)
		require.Equal(t, configMD5, req.Result.ConfigurationHash)
		err = store.UpdateAlertmanagerConfiguration(context.Background(), &models.SaveAlertmanagerConfigurationCmd{
			AlertmanagerConfiguration: config,
			FetchedConfigurationHash:  "the-wrong-hash",
			ConfigurationVersion:      "v1",
			Default:                   false,
			OrgID:                     1,
		})
		require.Error(t, err)
		require.EqualError(t, ErrVersionLockedObjectNotFound, err.Error())
	})
}

func TestIntegrationAlertmanagerConfigCleanup(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}
	sqlStore := db.InitTestDB(t)
	store := &DBstore{
		SQLStore: sqlStore,
		Logger:   log.NewNopLogger(),
	}
	t.Run("when calling the cleanup with fewer records than the limit all recrods should stay", func(t *testing.T) {
		var orgID int64 = 3
		oldestConfig, _ := setupConfig(t, "oldest-record", store)
		err := store.SaveAlertmanagerConfiguration(context.Background(), &models.SaveAlertmanagerConfigurationCmd{
			AlertmanagerConfiguration: oldestConfig,
			ConfigurationVersion:      "v1",
			Default:                   false,
			OrgID:                     orgID,
		})
		require.NoError(t, err)

		olderConfig, _ := setupConfig(t, "older-record", store)
		err = store.SaveAlertmanagerConfiguration(context.Background(), &models.SaveAlertmanagerConfigurationCmd{
			AlertmanagerConfiguration: olderConfig,
			ConfigurationVersion:      "v1",
			Default:                   false,
			OrgID:                     orgID,
		})
		require.NoError(t, err)

		config, _ := setupConfig(t, "newest-record", store)
		err = store.SaveAlertmanagerConfiguration(context.Background(), &models.SaveAlertmanagerConfigurationCmd{
			AlertmanagerConfiguration: config,
			ConfigurationVersion:      "v1",
			Default:                   false,
			OrgID:                     orgID,
		})
		require.NoError(t, err)

		rowsAffected, err := store.deleteOldConfigurations(context.Background(), orgID, 100)
		require.Equal(t, int64(0), rowsAffected)
		require.NoError(t, err)

		req := &models.GetLatestAlertmanagerConfigurationQuery{
			OrgID: orgID,
		}
		err = store.GetLatestAlertmanagerConfiguration(context.Background(), req)
		require.NoError(t, err)
		require.Equal(t, "newest-record", req.Result.AlertmanagerConfiguration)
	})
	t.Run("when calling the cleanup only the oldest records surpassing the limit should be deleted", func(t *testing.T) {
		var orgID int64 = 2
		oldestConfig, _ := setupConfig(t, "oldest-record", store)
		err := store.SaveAlertmanagerConfiguration(context.Background(), &models.SaveAlertmanagerConfigurationCmd{
			AlertmanagerConfiguration: oldestConfig,
			ConfigurationVersion:      "v1",
			Default:                   false,
			OrgID:                     orgID,
		})
		require.NoError(t, err)

		olderConfig, _ := setupConfig(t, "older-record", store)
		err = store.SaveAlertmanagerConfiguration(context.Background(), &models.SaveAlertmanagerConfigurationCmd{
			AlertmanagerConfiguration: olderConfig,
			ConfigurationVersion:      "v1",
			Default:                   false,
			OrgID:                     orgID,
		})
		require.NoError(t, err)

		config, _ := setupConfig(t, "newest-record", store)
		err = store.SaveAlertmanagerConfiguration(context.Background(), &models.SaveAlertmanagerConfigurationCmd{
			AlertmanagerConfiguration: config,
			ConfigurationVersion:      "v1",
			Default:                   false,
			OrgID:                     orgID,
		})
		require.NoError(t, err)

		rowsAffacted, err := store.deleteOldConfigurations(context.Background(), orgID, 1)
		require.Equal(t, int64(2), rowsAffacted)
		require.NoError(t, err)

		req := &models.GetLatestAlertmanagerConfigurationQuery{
			OrgID: orgID,
		}
		err = store.GetLatestAlertmanagerConfiguration(context.Background(), req)
		require.NoError(t, err)
		require.Equal(t, "newest-record", req.Result.AlertmanagerConfiguration)
	})
	t.Run("limit set to 0 should fail", func(t *testing.T) {
		_, err := store.deleteOldConfigurations(context.Background(), 1, 0)
		require.Error(t, err)
	})
	t.Run("limit set to negative should fail", func(t *testing.T) {
		_, err := store.deleteOldConfigurations(context.Background(), 1, -1)
		require.Error(t, err)
	})
}

func TestMarkConfigurationAsApplied(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}
	sqlStore := db.InitTestDB(t)
	store := &DBstore{
		SQLStore: sqlStore,
		Logger:   log.NewNopLogger(),
	}

	t.Run("attempting to mark a non existent config as applied should fail", func(tt *testing.T) {
		cmd := models.MarkConfigurationAsAppliedCmd{
			OrgID:             10,
			ConfigurationHash: "test",
		}
		err := store.MarkConfigurationAsApplied(context.Background(), &cmd)
		require.Error(tt, err)
	})

	t.Run("marking an existent config should succeed", func(tt *testing.T) {
		const orgID = 1
		ctx := context.Background()

		config, _ := setupConfig(t, "test", store)
		err := store.SaveAlertmanagerConfiguration(ctx, &models.SaveAlertmanagerConfigurationCmd{
			AlertmanagerConfiguration: config,
			ConfigurationVersion:      "v1",
			Default:                   false,
			OrgID:                     orgID,
		})
		require.NoError(tt, err)

		query := models.GetLatestAlertmanagerConfigurationQuery{
			OrgID: orgID,
		}
		err = store.GetLatestAlertmanagerConfiguration(ctx, &query)
		require.NoError(tt, err)

		cmd := models.MarkConfigurationAsAppliedCmd{
			OrgID:             orgID,
			ConfigurationHash: query.Result.ConfigurationHash,
		}
		err = store.MarkConfigurationAsApplied(ctx, &cmd)
		require.NoError(tt, err)

		// Config should now be saved and marked as successfully applied.
		appliedCfgsQuery := models.GetAppliedConfigurationsQuery{
			OrgID: orgID,
		}
		err = store.GetAppliedConfigurations(ctx, &appliedCfgsQuery)
		require.NoError(tt, err)

		require.Len(tt, appliedCfgsQuery.Result, 1)
	})
}

func setupConfig(t *testing.T, config string, store *DBstore) (string, string) {
	t.Helper()
	return setupConfigInOrg(t, config, 1, store)
}

func setupConfigInOrg(t *testing.T, config string, org int64, store *DBstore) (string, string) {
	t.Helper()
	config, configMD5 := config, fmt.Sprintf("%x", md5.Sum([]byte(config)))
	cmd := buildSaveConfigCmd(t, config, org)
	err := store.SaveAlertmanagerConfiguration(context.Background(), &cmd)
	require.NoError(t, err)
	return config, configMD5
}

func buildSaveConfigCmd(t *testing.T, config string, org int64) models.SaveAlertmanagerConfigurationCmd {
	t.Helper()
	return models.SaveAlertmanagerConfigurationCmd{
		AlertmanagerConfiguration: config,
		ConfigurationVersion:      "v1",
		Default:                   false,
		OrgID:                     org,
	}
}
