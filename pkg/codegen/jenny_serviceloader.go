package codegen

// GoServiceCRUDFuncJenny is a [OneToOne] that produces standard CRUD passthrough funcs
// corresponding to a DeclForGen.
type GoServiceCRUDFuncJenny struct{}

func (j GoServiceCRUDFuncJenny) JennyName() string {
	return "GoServiceCRUDFuncJenny"
}

// func (j GoServiceCRUDFuncJenny) Generate(decl *DeclForGen) (*codejen.File, error) {
// 	if !decl.IsCoreStructured() {
// 		return nil, nil
// 	}
//
// 	meta := decl.Properties.(kindsys.CoreStructuredProperties)
// 	doanything := meta.BackendCRUDFuncs.Delete || meta.BackendCRUDFuncs.Create || meta.BackendCRUDFuncs.Update || meta.BackendCRUDFuncs.Load
// 	if !doanything {
// 		return nil, nil
// 	}
//
// 	buf := new(bytes.Buffer)
// 	if err := tmpls.Lookup("service_crudfuncs.tmpl").Execute(buf, meta); err != nil {
// 		return nil, fmt.Errorf("failed executing service_crudfuncs template: %w", err)
// 	}
//
// 	return codejen.NewFile(decl.Lineage().Name()+"_types_gen.go", buf.Bytes(), j), nil
// }
