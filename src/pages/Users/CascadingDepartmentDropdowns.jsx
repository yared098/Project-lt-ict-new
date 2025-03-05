import React, { useEffect } from "react";
import { FormGroup, Label, Input, FormFeedback } from "reactstrap";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useFetchDepartments } from "../../queries/department_query";
import { post } from "../../helpers/api_Lists";

const fetchDepartmentsByParent = async (parentId = null) => {
  const response = await post(`department/departmentbyparent?parent_id=${parentId}`);
  return response?.data || [];
};

const CascadingDepartmentDropdowns = ({
  validation,
  dropdown1name,
  dropdown2name,
  dropdown3name,
  dropdown4name,
  required = false,
}) => {
  const { t } = useTranslation();
  // Fetch initial departments
  const { data: departments = [], isLoading: loadingDepartments } = useFetchDepartments()
  // const { data: departments = [], isLoading: loadingDepartments } = useQuery({
  //   queryKey: ["subDepartments"],
  //   queryFn: () => fetchDepartmentsByParent(),
  //   enabled: true,
  // });

  // Fetch sub-departments for selected department
  const { data: subDepartments1 = [], isLoading: loadingSub1 } = useQuery({
    queryKey: ["subDepartments1", validation.values[dropdown1name]],
    queryFn: () => fetchDepartmentsByParent(validation.values[dropdown1name]),
    enabled: !!validation.values[dropdown1name],
  });

  // Fetch sub-departments for second level
  const { data: subDepartments2 = [], isLoading: loadingSub2 } = useQuery({
    queryKey: ["subDepartments2", validation.values[dropdown2name]],
    queryFn: () => fetchDepartmentsByParent(validation.values[dropdown2name]),
    enabled: !!validation.values[dropdown2name],
  });

  // Fetch sub-departments for third level
  const { data: subDepartments3 = [], isLoading: loadingSub3 } = useQuery({
    queryKey: ["subDepartments3", validation.values[dropdown3name]],
    queryFn: () => fetchDepartmentsByParent(validation.values[dropdown3name]),
    enabled: !!validation.values[dropdown3name],
  });

  // Handle department change
  const handleDepartmentChange = (e) => {
    validation.handleChange(e);
    validation.setFieldValue(dropdown2name, "");
    validation.setFieldValue(dropdown3name, "");
    validation.setFieldValue(dropdown4name, "");
  };

  // Handle sub-department level 1 change
  const handleSub1Change = (e) => {
    validation.handleChange(e);
    validation.setFieldValue(dropdown3name, "");
    validation.setFieldValue(dropdown4name, "");
  };

  // Handle sub-department level 2 change
  const handleSub2Change = (e) => {
    validation.handleChange(e);
    validation.setFieldValue(dropdown4name, "");
  };

  return (
    <>
      {/* Department Dropdown */}
      <FormGroup>
        <Label for={dropdown1name}>{t("department")} {required && <span className="text-danger">*</span>}</Label>
        <Input
          type="select"
          name={dropdown1name}
          value={validation.values[dropdown1name]}
          onChange={handleDepartmentChange}
          onBlur={validation.handleBlur}
        >
          <option value="">{t("select_department")}</option>
          {loadingDepartments ? <option disabled>{t("Loading...")}</option> :
            departments?.data.map((dept) => <option key={dept.dep_id} value={dept.dep_id}>{dept.dep_name_en}</option>)
          }
        </Input>
      </FormGroup>

      {/* Sub-department Level 1 */}
      <FormGroup>
        <Label for={dropdown2name}>{t(`${dropdown2name}`)}</Label>
        <Input
          type="select"
          name={dropdown2name}
          value={validation.values[dropdown2name]}
          onChange={handleSub1Change}
          onBlur={validation.handleBlur}
          disabled={loadingSub1 || subDepartments1.length === 0}
        >
          <option value="">{t("select_sub_department_1")}</option>
          {subDepartments1.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
        </Input>
      </FormGroup>

      {/* Sub-department Level 2 */}
      <FormGroup>
        <Label for={dropdown3name}>{t(`${dropdown3name}`)}</Label>
        <Input
          type="select"
          name={dropdown3name}
          value={validation.values[dropdown3name]}
          onChange={handleSub2Change}
          onBlur={validation.handleBlur}
          disabled={loadingSub2 || subDepartments2.length === 0}
        >
          <option value="">{t("select_sub_department_2")}</option>
          {subDepartments2.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
        </Input>
      </FormGroup>

      {/* Sub-department Level 3 */}
      <FormGroup>
        <Label for={dropdown4name}>{t(`${dropdown4name}`)}</Label>
        <Input
          type="select"
          name={dropdown4name}
          value={validation.values[dropdown4name]}
          onChange={validation.handleChange}
          onBlur={validation.handleBlur}
          disabled={loadingSub3 || subDepartments3.length === 0}
        >
          <option value="">{t("select_sub_department_3")}</option>
          {subDepartments3.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
        </Input>
      </FormGroup>
    </>
  );
};

export default CascadingDepartmentDropdowns;
