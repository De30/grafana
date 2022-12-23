package fs

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
)

// CopyFile copies a file from src to dst.
//
// If src and dst files exist, and are the same, then return success. Otherwise, attempt to create a hard link
// between the two files. If that fails, copy the file contents from src to dst.
func CopyFile(src, dst string) (err error) {
	absSrc, err := filepath.Abs(src)
	if err != nil {
		return fmt.Errorf("failed to get absolute path of source file %q: %w", src, err)
	}
	sfi, err := os.Stat(src)
	if err != nil {
		err = fmt.Errorf("couldn't stat source file %q: %w", absSrc, err)
		return
	}
	if !sfi.Mode().IsRegular() {
		// Cannot copy non-regular files (e.g., directories, symlinks, devices, etc.)
		return fmt.Errorf("non-regular source file %s (%q)", absSrc, sfi.Mode().String())
	}
	dpath := filepath.Dir(dst)
	exists, err := Exists(dpath)
	if err != nil {
		return err
	}
	if !exists {
		err = fmt.Errorf("destination directory doesn't exist: %q", dpath)
		return
	}

	var dfi os.FileInfo
	dfi, err = os.Stat(dst)
	if err != nil {
		if !os.IsNotExist(err) {
			return
		}
	} else {
		if !(dfi.Mode().IsRegular()) {
			return fmt.Errorf("non-regular destination file %s (%q)", dfi.Name(), dfi.Mode().String())
		}
		if os.SameFile(sfi, dfi) {
			return copyPermissions(sfi.Name(), dfi.Name())
		}
	}

	if err = os.Link(src, dst); err == nil {
		return copyPermissions(src, dst)
	}

	err = copyFileContents(src, dst)
	return err
}

// copyFileContents copies the contents of the file named src to the file named
// by dst. The file will be created if it does not already exist. If the
// destination file exists, all it's contents will be replaced by the contents
// of the source file.
func copyFileContents(src, dst string) (err error) {
	// Can ignore gosec G304 here, since it's a general file copying function
	// nolint:gosec
	in, err := os.Open(src)
	if err != nil {
		return
	}
	defer func() {
		if e := in.Close(); err == nil && e != nil {
			err = e
		}
	}()

	//nolint:gosec
	out, err := os.Create(dst)
	if err != nil {
		return
	}
	defer func() {
		if cerr := out.Close(); cerr != nil && err == nil {
			err = cerr
		}
	}()

	if _, err = io.Copy(out, in); err != nil {
		return
	}

	if err := out.Sync(); err != nil {
		return err
	}

	return copyPermissions(src, dst)
}

func copyPermissions(src, dst string) error {
	sfi, err := os.Lstat(src)
	if err != nil {
		return err
	}

	if err := os.Chmod(dst, sfi.Mode()); err != nil {
		return err
	}

	return nil
}

// CopyRecursive copies files and directories recursively.
func CopyRecursive(src, dst string, excludeRegexes ...*regexp.Regexp) error {
	sfi, err := os.Stat(src)
	if err != nil {
		return err
	}
	if !sfi.IsDir() {
		return CopyFile(src, dst)
	}

	entries, err := os.ReadDir(src)
	if err != nil {
		return err
	}

ENTRIES:
	for _, entry := range entries {
		srcPath := filepath.Join(src, entry.Name())
		for _, excludeRegex := range excludeRegexes {
			if excludeRegex.MatchString(srcPath) {
				continue ENTRIES
			}
		}

		srcFi, err := entry.Info()
		if err != nil {
			return err
		}

		dstPath := filepath.Join(dst, entry.Name())

		switch entry.Type() {
		case os.ModeNamedPipe:
			break
		case os.ModeSocket:
			break
		case os.ModeDevice:
			break
		case os.ModeCharDevice:
			break
		case os.ModeIrregular:
			break
		case os.ModeDir:
			if err := CopyRecursive(srcPath, dstPath, excludeRegexes...); err != nil {
				return err
			}

			// if directory was created, chmod it
			if _, err := os.Stat(dstPath); os.IsNotExist(err) {
				// directory wasn't created, no files found
			} else if err != nil {
				return err
			} else {
				if err := os.Chmod(dstPath, srcFi.Mode()); err != nil {
					return err
				}
			}
		case os.ModeSymlink:
			fmt.Printf("copying symlink %s\n", srcPath)

			if _, err := os.Stat(dst); os.IsNotExist(err) {
				if err := os.MkdirAll(dst, sfi.Mode()); err != nil {
					return fmt.Errorf("failed to create directory %q: %s", dst, err)
				}
			}

			link, err := os.Readlink(srcPath)
			if err != nil {
				return err
			}
			if err := os.Symlink(link, dstPath); err != nil {
				return err
			}
			if err := os.Chmod(dstPath, srcFi.Mode()); err != nil {
				return err
			}
		case 0: // regular File
			fmt.Printf("copying file %s\n", srcPath)

			if _, err := os.Stat(dst); os.IsNotExist(err) {
				if err := os.MkdirAll(dst, sfi.Mode()); err != nil {
					return fmt.Errorf("failed to create directory %q: %s", dst, err)
				}
			}

			if err := CopyFile(srcPath, dstPath); err != nil {
				return err
			}
		default:
			return fmt.Errorf("unknown file type for path %s: %s", srcPath, entry.Type())
		}
	}

	return nil
}
