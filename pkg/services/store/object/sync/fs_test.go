package sync

import (
	"fmt"
	"os"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestFileWalker(t *testing.T) {
	repo := FSRepo{
		fsys: os.DirFS("../../../../../devenv/dev-dashboards"),
	}

	list := repo.List(".")

	fmt.Println("GOT", list)

	require.Fail(t, "done")
}
