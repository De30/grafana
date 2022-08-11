package libraryelements

import (
	"context"

	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/dashboards"
	"github.com/grafana/grafana/pkg/services/guardian"
	"github.com/grafana/grafana/pkg/services/user"
)

func isGeneralFolder(folderID int64) bool {
	return folderID == 0
}

func (l *LibraryElementService) requireSupportedElementKind(kindAsInt int64) error {
	kind := models.LibraryElementKind(kindAsInt)
	switch kind {
	case models.PanelElement:
		return nil
	case models.VariableElement:
		return nil
	default:
		return errLibraryElementUnSupportedElementKind
	}
}

func (l *LibraryElementService) requireEditPermissionsOnFolder(ctx context.Context, usr *user.SignedInUser, folderID int64) error {
	if isGeneralFolder(folderID) && usr.HasRole(user.RoleEditor) {
		return nil
	}

	if isGeneralFolder(folderID) && usr.HasRole(user.RoleViewer) {
		return dashboards.ErrFolderAccessDenied
	}
	folder, err := l.folderService.GetFolderByID(ctx, usr, folderID, usr.OrgId)
	if err != nil {
		return err
	}

	g := guardian.New(ctx, folder.Id, usr.OrgId, usr)

	canEdit, err := g.CanEdit()
	if err != nil {
		return err
	}
	if !canEdit {
		return dashboards.ErrFolderAccessDenied
	}

	return nil
}

func (l *LibraryElementService) requireViewPermissionsOnFolder(ctx context.Context, usr *user.SignedInUser, folderID int64) error {
	if isGeneralFolder(folderID) && usr.HasRole(user.RoleViewer) {
		return nil
	}

	folder, err := l.folderService.GetFolderByID(ctx, usr, folderID, usr.OrgId)
	if err != nil {
		return err
	}

	g := guardian.New(ctx, folder.Id, usr.OrgId, usr)

	canView, err := g.CanView()
	if err != nil {
		return err
	}
	if !canView {
		return dashboards.ErrFolderAccessDenied
	}

	return nil
}
