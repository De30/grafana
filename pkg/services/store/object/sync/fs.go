package sync

import (
	"crypto/sha1"
	"fmt"
	"io/fs"
)

type FSRepo struct {
	fsys fs.FS
}

func (f *FSRepo) List(root string) []OriginFileInfo {
	files := make([]OriginFileInfo, 0)
	hasher := sha1.New()
	fs.WalkDir(f.fsys, root, func(path string, d fs.DirEntry, err error) error {
		if d.IsDir() || err != nil {
			return err
		}
		info, err := d.Info()
		if err != nil {
			return err
		}

		hasher.Reset()
		_, _ = hasher.Write([]byte(info.Name()))
		_, _ = hasher.Write([]byte(fmt.Sprintf("%d/%v", info.Size(), info.ModTime())))
		rev := hasher.Sum(nil)[:7]

		files = append(files, OriginFileInfo{
			Path: path,
			Key:  fmt.Sprintf("%x", rev),
		})
		return nil
	})
	return files
}
