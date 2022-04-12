package store

import (
	"context"
	"io"
	"io/ioutil"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/data"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/plugins/backendplugin/pluginextensionv2"
	"github.com/grafana/grafana/pkg/web"
)

// HTTPStorageService passes raw HTTP requests to a well typed storage service
type HTTPStorageService interface {
	Storages(c *models.ReqContext) response.Response
	List(c *models.ReqContext) response.Response
	Read(c *models.ReqContext) response.Response
	Delete(c *models.ReqContext) response.Response
	Upload(c *models.ReqContext) response.Response
}

type httpStorage struct {
	store StorageService
}

func ProvideHTTPService(store StorageService) HTTPStorageService {
	return &httpStorage{
		store: store,
	}
}

func (s *httpStorage) upload(ctx context.Context, user *models.SignedInUser, form *multipart.Form) (*Response, error) {
	resp := Response{
		path:       "upload",
		statusCode: 200,
		message:    "Uploaded successfully",
		err:        false,
	}

	files := form.File["file"]
	for _, fileHeader := range files {
		// Restrict the size of each uploaded file to 1MB.
		if fileHeader.Size > MaxUploadSize {
			resp.statusCode = 400
			resp.message = "The uploaded image is too big"
			resp.err = true
			return &resp, nil
		}

		// open each file to copy contents
		file, err := fileHeader.Open()
		if err != nil {
			return nil, err
		}
		err = file.Close()
		if err != nil {
			return nil, err
		}

		fileData, err := ioutil.ReadAll(io.LimitReader(file, MaxUploadSize))
		if err != nil {
			return nil, err
		}
		filetype := http.DetectContentType(fileData)
		// only allow images to be uploaded
		if (filetype != "image/jpeg") && (filetype != "image/jpg") && (filetype != "image/gif") && (filetype != "image/png") && (filetype != "image/svg+xml") && (filetype != "image/webp") && !strings.HasSuffix(fileHeader.Filename, ".svg") {
			return &Response{
				statusCode: 400,
				message:    "unsupported file type uploaded",
				err:        true,
			}, nil
		}
		grn := filepath.Join("upload", fileHeader.Filename)
		_, err = s.store.Write(ctx, user, &pluginextensionv2.WriteRequest{
			Ref: &pluginextensionv2.EntityReference{
				Kind: "image", // TODO: which kind?
				Grn:  grn,
			},
			ContentType: filetype,
			Body:        fileData,
		})
		if err != nil {
			return nil, err
		}
		resp.fileName = fileHeader.Filename
		resp.path = grn
	}
	return &resp, nil
}

func (s *httpStorage) Upload(c *models.ReqContext) response.Response {
	// 32 MB is the default used by FormFile()
	if err := c.Req.ParseMultipartForm(32 << 20); err != nil {
		return response.Error(400, "error in parsing form", err)
	}
	res, err := s.upload(c.Req.Context(), c.SignedInUser, c.Req.MultipartForm)

	if err != nil {
		return response.Error(500, "Internal Server Error", err)
	}

	return response.JSON(res.statusCode, map[string]string{
		"message": res.message,
		"path":    res.path,
		"file":    res.fileName,
	})
}

func (s *httpStorage) Read(c *models.ReqContext) response.Response {
	// full path is /api/storage/read/upload/example.jpg, but we only want the part after read
	path := strings.TrimPrefix(c.Req.RequestURI, "/api/storage/read/")

	res, err := s.store.Read(c.Req.Context(), c.SignedInUser, &pluginextensionv2.GetRequest{
		Ref: &pluginextensionv2.EntityReference{
			Kind: "image", // TODO: can we make kind part of GRN? image://upload/file.jpg? or upload/file.image.jpg?
			Grn:  path,
		},
	})
	if err != nil {
		// TODO: better error handling.
		return response.Error(400, "cannot call read", err)
	}
	// set the correct content type for svg
	if strings.HasSuffix(path, ".svg") {
		c.Resp.Header().Set("Content-Type", "image/svg+xml") // TODO: use Content Type here? Prepare in Write path?
	}
	return response.Respond(200, res.Object.Body)
}

func (s *httpStorage) Delete(c *models.ReqContext) response.Response {
	action := "Delete"
	scope, path := getPathAndScope(c)

	return response.JSON(200, map[string]string{
		"action": action,
		"scope":  scope,
		"path":   path,
	})
}

func (s *httpStorage) Storages(c *models.ReqContext) response.Response {
	rootsMeta, err := s.store.Storages(c.Req.Context(), c.SignedInUser)
	if err != nil {
		return response.Error(400, "error reading path", err)
	}

	count := len(rootsMeta)
	title := data.NewFieldFromFieldType(data.FieldTypeString, count)
	names := data.NewFieldFromFieldType(data.FieldTypeString, count)
	mtype := data.NewFieldFromFieldType(data.FieldTypeString, count)
	title.Name = "title"
	names.Name = "name"
	mtype.Name = "mediaType"
	for i, meta := range rootsMeta {
		names.Set(i, meta.Config.Prefix)
		title.Set(i, meta.Config.Name)
		mtype.Set(i, "directory")
	}
	frame := data.NewFrame("", names, title, mtype)
	frame.SetMeta(&data.FrameMeta{
		Type: data.FrameTypeDirectoryListing,
	})

	if frame == nil {
		return response.Error(404, "not found", nil)
	}
	return response.JSONStreaming(200, frame)
}

func (s *httpStorage) List(c *models.ReqContext) response.Response {
	params := web.Params(c.Req)
	path := params["*"]
	listResponse, err := s.store.List(c.Req.Context(), c.SignedInUser, &pluginextensionv2.ListRequest{
		GrnFilter: path,
	})
	if err != nil {
		return response.Error(400, "error reading path", err)
	}

	count := len(listResponse.Objects)
	names := data.NewFieldFromFieldType(data.FieldTypeString, count)
	mtype := data.NewFieldFromFieldType(data.FieldTypeString, count)
	fsize := data.NewFieldFromFieldType(data.FieldTypeInt64, count)
	names.Name = "name"
	mtype.Name = "mediaType"
	fsize.Name = "size"
	fsize.Config = &data.FieldConfig{
		Unit: "bytes",
	}
	for i, f := range listResponse.Objects {
		names.Set(i, f.Name)
		mtype.Set(i, f.ContentType)
		fsize.Set(i, f.Size)
	}
	frame := data.NewFrame("", names, mtype, fsize)
	frame.SetMeta(&data.FrameMeta{
		Type: data.FrameTypeDirectoryListing,
		Custom: map[string]interface{}{
			"HasMore": listResponse.HasMore,
		},
	})

	if frame == nil {
		return response.Error(404, "not found", nil)
	}
	return response.JSONStreaming(200, frame)
}
