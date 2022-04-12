package store

import (
	"context"

	"github.com/grafana/grafana/pkg/infra/filestorage"
)

type nestedTree struct {
	roots  []storageRuntime
	lookup map[string]filestorage.FileStorage
}

var (
	_ storageTree = (*nestedTree)(nil)
)

func (t *nestedTree) init() {
	t.lookup = make(map[string]filestorage.FileStorage, len(t.roots))
	for _, root := range t.roots {
		t.lookup[root.Meta().Config.Prefix] = root.Store()
	}
}

func (t *nestedTree) getRoot(path string) (filestorage.FileStorage, string) {
	rootKey, path := splitFirstSegment(path)
	root, ok := t.lookup[rootKey]
	if !ok || root == nil {
		return nil, path // not found or not ready
	}
	return root, filestorage.Delimiter + path
}

func (t *nestedTree) GetFile(ctx context.Context, path string) (*filestorage.File, error) {
	if path == "" {
		return nil, nil // not found
	}
	root, path := t.getRoot(path)
	if root == nil {
		return nil, nil // not found (or not ready)
	}
	return root.Get(ctx, path)
}

func (t *nestedTree) ListFolder(ctx context.Context, path string) (*filestorage.ListResponse, error) {
	if path == "" {
		return nil, nil // not found
	}
	root, path := t.getRoot(path)
	if root == nil {
		return nil, nil // not found (or not ready)
	}
	return root.List(ctx, path, nil, &filestorage.ListOptions{Recursive: false, WithFolders: true, WithFiles: true})
}

func (t *nestedTree) Delete(ctx context.Context, path string) error {
	if path == "" {
		return nil // nothing to delete
	}
	root, path := t.getRoot(path)
	if root == nil {
		return nil // nothing to delete
	}
	// TODO: there is also DeleteFolder method, should we somehow distinguish?
	return root.Delete(ctx, path)
}
