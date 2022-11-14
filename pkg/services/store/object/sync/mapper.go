package sync

import (
	"crypto/md5"
	"crypto/sha1"
	"encoding/base64"
	"encoding/hex"
	"path/filepath"
	"strings"

	"github.com/gosimple/slug"
)

type PathMappingMode string

const (
	ModeRaw  PathMappingMode = "raw"  // Use the value directly
	ModeSlug PathMappingMode = "slug" // Create a slug value from the names
	ModeMD5  PathMappingMode = "md5"  // hash the path (md5)
	ModeSHA1 PathMappingMode = "sha1" // hash the path (sha1)
)

type MapperOpts struct {
	Mode        PathMappingMode
	IncludePath bool
	Prefix      string // optionally include additional prefix to make it unique (eg plugin ID)
	MaxLength   int
}

func GetPathMapper(opts MapperOpts) func(string) string {
	norm := getNormalizer(opts)
	trim := getTrimmer(opts)
	switch opts.Mode {
	case ModeRaw:
		return func(path string) string {
			return trim(norm(path))
		}
	case ModeSlug:
		return func(path string) string {
			s := slug.Make(strings.ToLower(norm(path)))
			if s == "" {
				// If the dashboard name is only characters outside of the
				// sluggable characters, the slug creation will return an
				// empty string which will mess up URLs. This failsafe picks
				// that up and creates the slug as a base64 identifier instead.
				s = base64.RawURLEncoding.EncodeToString([]byte(path))
				if slug.MaxLength != 0 && len(s) > slug.MaxLength {
					s = s[:slug.MaxLength]
				}
			}
			return trim(s)
		}
	case ModeMD5:
		return func(path string) string {
			hash := md5.Sum([]byte(norm(path)))
			return trim(hex.EncodeToString(hash[:]))
		}
	case ModeSHA1:
		return func(path string) string {
			hash := sha1.Sum([]byte(norm(path)))
			return trim(hex.EncodeToString(hash[:]))
		}
	}

	// Should not happen
	return func(path string) string {
		return path
	}
}

func getNormalizer(opts MapperOpts) func(string) string {
	return func(p string) string {
		if !opts.IncludePath {
			p = filepath.Base(p)
		}
		idx := strings.LastIndex(p, ".")
		if idx > 0 {
			p = p[:idx]
		}
		return opts.Prefix + p
	}
}

func getTrimmer(opts MapperOpts) func(string) string {
	if opts.MaxLength > 0 {
		return func(p string) string {
			return p[:opts.MaxLength]
		}
	}
	return func(p string) string {
		return p
	}
}

// Get the UID from the final part of the file name
func GetUIDFromPath(path string, opts MapperOpts) string {
	name := filepath.Base(path)
	idx := strings.LastIndex(name, ".")
	if idx > 0 {
		return name[:idx]
	}
	return name
}

// Get the UID from the final part of the file name
func GetUIDFromPathSlug(namespace string, path string) string {
	idx := strings.LastIndex(path, ".")
	if idx > 0 {
		path = path[:idx]
	}
	s := slug.Make(strings.ToLower(path))
	if s == "" {
		// If the dashboard name is only characters outside of the
		// sluggable characters, the slug creation will return an
		// empty string which will mess up URLs. This failsafe picks
		// that up and creates the slug as a base64 identifier instead.
		s = base64.RawURLEncoding.EncodeToString([]byte(path))
		if slug.MaxLength != 0 && len(s) > slug.MaxLength {
			s = s[:slug.MaxLength]
		}
	}
	return s
}
