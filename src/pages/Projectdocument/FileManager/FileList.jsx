import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardBody,
  Col,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Form,
  Row,
  UncontrolledDropdown,
  Table,
} from "reactstrap";
import ProjectDocumentModal from "../ProjectDocumentModal";
import DeleteModal from "../../../components/Common/DeleteModal";
import { BsFillGrid1X2Fill } from "react-icons/bs";

const formatFileSize = (bytes) => {
  if (isNaN(bytes) || bytes < 0) return "0 KB";

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const FileList = ({
  files,
  edit,
  handleDeleteProjectDocument,
  deleteModal,
  setDeleteModal,
  isDeleteLoading,
  onClickDelete,
}) => {
  const [modal1, setModal1] = useState(false);
  const [details, setDetails] = useState({});
  const [isGridView, setIsGridView] = useState(true); // State for view mode

  const toggleViewModal = () => setModal1(!modal1);

  // Toggle between grid and list view
  const toggleViewMode = () => {
    setIsGridView((prev) => !prev);
  };

  // Function to get file icon details
  const getFileIcon = (extension) => {
    switch (extension?.toLowerCase()) {
      case "pdf":
        return { icon: "bx bxs-file-pdf", color: "text-danger" };
      case "doc":
      case "docx":
        return { icon: "bx bxs-file-word", color: "text-primary" };
      case "xls":
      case "xlsx":
        return { icon: "bx bxs-file-excel", color: "text-success" };
      case "ppt":
      case "pptx":
        return { icon: "bx bxs-file-powerpoint", color: "text-warning" };
      case "txt":
        return { icon: "bx bxs-file-txt", color: "text-muted" };
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return { icon: "bx bxs-file-image", color: "text-info" };
      case "zip":
      case "rar":
        return { icon: "bx bxs-file-archive", color: "text-secondary" };
      default:
        return { icon: "bx bxs-file", color: "text-dark" };
    }
  };

  return (
    <React.Fragment>
      <ProjectDocumentModal
        isOpen={modal1}
        toggle={toggleViewModal}
        transaction={details}
      />
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteProjectDocument}
        onCloseClick={() => setDeleteModal(false)}
        isLoading={isDeleteLoading}
      />
      <div>
        <Row className="mb-3">
          <Col xl={3} sm={6}>
            <div className="mt-2">
              <h5>Documents</h5>
            </div>
          </Col>
          <Col xl={9} sm={6}>
            <Form className="mt-4 mt-sm-0 float-sm-end d-flex align-items-center h-full">
              <div className="search-box me-2">
                <div className="position-relative">
                  <input
                    type="text"
                    className="form-control bg-light border-light rounded"
                    placeholder="Search..."
                  />
                  <i className="bx bx-search-alt search-icon"></i>
                </div>
              </div>
              <BsFillGrid1X2Fill
                size={24}
                className="cursor-pointer"
                onClick={toggleViewMode} // Toggle view mode on click
              />
            </Form>
          </Col>
        </Row>
      </div>
      <div>
        {files.length > 0 ? (
          isGridView ? (
            // Grid View
            <Row>
              {files.map((file, key) => {
                const { icon, color } = getFileIcon(file?.prd_file_extension);

                return (
                  <Col xl={4} sm={6} key={key}>
                    <Card className="shadow-none border">
                      <CardBody className="p-3">
                        <div>
                          <div className="float-end ms-2">
                            <UncontrolledDropdown className="mb-2">
                              <DropdownToggle
                                tag="a"
                                className="font-size-16 text-muted"
                              >
                                <i className="mdi mdi-dots-horizontal"></i>
                              </DropdownToggle>
                              <DropdownMenu className="dropdown-menu-end">
                                <DropdownItem
                                  to="#"
                                  onClick={() => {
                                    setDetails(file);
                                    toggleViewModal();
                                  }}
                                >
                                  Open
                                </DropdownItem>
                                <DropdownItem to="#" onClick={() => edit(file)}>
                                  Edit
                                </DropdownItem>
                                <div className="dropdown-divider"></div>
                                <DropdownItem
                                  to="#"
                                  className="text-danger"
                                  onClick={() => onClickDelete(file)}
                                >
                                  Delete
                                </DropdownItem>
                              </DropdownMenu>
                            </UncontrolledDropdown>
                          </div>

                          {/* Dynamic File Icon */}
                          <div className="avatar-xs me-3 mb-3">
                            <div className="avatar-title bg-transparent rounded">
                              <i
                                className={`${icon} ${color}`}
                                style={{ fontSize: "40px" }}
                              />
                            </div>
                          </div>

                          <div className="">
                            <div className="overflow-hidden me-auto">
                              <h5 className="font-size-14 text-truncate mb-1">
                                <Link to="#" className="text-body">
                                  {file?.prd_name}
                                </Link>
                              </h5>
                            </div>
                            <div className="align-self-end">
                              <p className="text-muted mb-0">
                                {formatFileSize(file?.prd_size)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          ) : (
            // List View
            <div className="table-responsive">
              <Table
                className="table align-middle table-nowrap table-hover mb-0"
                style={{ tableLayout: "fixed" }}
              >
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Date Modified</th>
                    <th scope="col">Size</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file, key) => {
                    const { icon, color } = getFileIcon(
                      file?.prd_file_extension
                    );

                    return (
                      <tr key={key} style={{ height: "30px" }}>
                        <td>
                          <Link to="#" className="text-dark fw-medium">
                            <i className={`${icon} ${color} me-2`}></i>
                            {file?.prd_name}
                          </Link>
                        </td>
                        <td>
                          {
                            new Date(file?.prd_update_time)
                              .toISOString()
                              .split("T")[0]
                          }
                        </td>

                        <td>{formatFileSize(file?.prd_size)}</td>
                        <td>
                          <UncontrolledDropdown>
                            <DropdownToggle
                              tag="a"
                              className="font-size-16 text-muted"
                              role="button"
                            >
                              <i className="mdi mdi-dots-horizontal"></i>
                            </DropdownToggle>
                            <DropdownMenu
                              className="dropdown-menu-end"
                              style={{ zIndex: 8000 }}
                            >
                              <DropdownItem
                                to="#"
                                onClick={() => {
                                  setDetails(file);
                                  toggleViewModal();
                                }}
                              >
                                Open
                              </DropdownItem>
                              <DropdownItem to="#" onClick={() => edit(file)}>
                                Edit
                              </DropdownItem>
                              <div className="dropdown-divider"></div>
                              <DropdownItem
                                to="#"
                                className="text-danger"
                                onClick={() => onClickDelete(file)}
                              >
                                Delete
                              </DropdownItem>
                            </DropdownMenu>
                          </UncontrolledDropdown>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )
        ) : (
          <div className="text-center p-4">
            <p className="text-muted">No files available.</p>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

export default FileList;
