package snapshot

import "context"

type Service interface {
	Create(ctx context.Context, cmd *CreateCmd) (*CreateResult, error)
	Delete(ctx context.Context, cmd *DeleteCmd) error
	GetByKey(ctx context.Context, query *GetByKeyQuery) (*GetResult, error)
	List(ctx context.Context, query *ListQuery) (*ListResult, error)
	DeleteExpired(ctx context.Context) (*DeleteExpiredResult, error)
}
