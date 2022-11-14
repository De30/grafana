package sync

type OriginFileInfo struct {
	Path string `json:"path"` // raw path on disk
	Key  string `json:"key"`  // check contents if different than the last time
}

type syncInfo struct {
	Repo    string            // Name of the repo we are syncing
	Files   OriginFileInfo    // list of files
	UIDMode string            // file-name, path-md5, path-hash, path-slug
	Alias   map[string]string // Old UID > New UID
}

/**

1. List all local paths (and revisions)
2. Ask server which revions have changed
3. Update each item where ref changed
4. Remove items that do not exist anymore

**/
