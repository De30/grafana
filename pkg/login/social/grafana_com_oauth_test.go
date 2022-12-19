package social

import (
	"net/http"
	"testing"

	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"golang.org/x/oauth2"
)

func TestSocialGrafanaCom_UserInfo(t *testing.T) {
	type fields struct {
		SocialBase      *SocialBase
		allowedGroups   []string
		skipOrgRoleSync bool
	}
	type args struct {
		client *http.Client
	}
	tests := []struct {
		name        string
		fields      fields
		oauth2token *oauth2.Token
		args        args
		want        *BasicUserInfo
		wantErr     error
	}{
		{
			name: "userinfo",
			fields: fields{
				SocialBase: newSocialBase("grafana_com", &oauth2.Config{}, &OAuthInfo{RoleAttributeStrict: true}, "", false, *featuremgmt.WithFeatures()),
			},
			want:    nil,
			wantErr: nil,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			s := &SocialGrafanaCom{
				SocialBase: tc.fields.SocialBase,
			}
			s.UserInfo()
		})
	}
}
