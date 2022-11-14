package sync

import (
	"fmt"
	"io/fs"
	"time"

	"github.com/grafana/grafana/pkg/services/store/object"
)

var _ fs.FS = &ObjectStoreFS{}
var _ fs.File = &objectStoreFile{}
var _ fs.FileInfo = &objectStoreFileInfo{}

type ObjectStoreFS struct {
	srv object.ObjectStoreServer
}

type objectStoreFile struct {
	path string
}

type objectStoreFileInfo struct {
	//path string
}

func NewObjectStoreFS(srv object.ObjectStoreServer) *ObjectStoreFS {
	return &ObjectStoreFS{
		srv: srv,
	}
}

func (f *ObjectStoreFS) Open(name string) (fs.File, error) {
	file := &objectStoreFile{
		path: name,
	}
	return file, nil
}

func (f *objectStoreFile) Stat() (fs.FileInfo, error) {
	return nil, fmt.Errorf("not implemented")
}

func (f *objectStoreFile) Read([]byte) (int, error) {
	return 0, fmt.Errorf("not implemented")
}

func (f *objectStoreFile) Close() error {
	return fmt.Errorf("not implemented")
}

func (f *objectStoreFileInfo) Name() string {
	return "?"
}

func (f *objectStoreFileInfo) Size() int64 {
	return 0
}

func (f *objectStoreFileInfo) Mode() fs.FileMode {
	return 777
}

func (f *objectStoreFileInfo) ModTime() time.Time {
	return time.Now()
}

func (f *objectStoreFileInfo) IsDir() bool {
	return false
}

func (f *objectStoreFileInfo) Sys() any {
	return nil
}
