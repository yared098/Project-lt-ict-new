import React, { useEffect, useState } from "react";
import {
  Form,
  Label,
  Input,
  Button,
  Card,
  CardBody,
  FormFeedback,
  Col,
  Row,
  Spinner,
} from "reactstrap";
import { formatDistanceToNow, parseISO } from "date-fns";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { useFormik } from "formik";
import {
  useAddConversationInformation,
  useFetchConversationInformations,
} from "../../queries/conversationinformation_query";
import { useTranslation } from "react-i18next";


const Conversation = (props) => {
  const [conversationInformation, setConversationInformation] = useState(null);
  const { data } = useFetchConversationInformations();
  const { t } = useTranslation();

  useEffect(() => {
    setConversationInformation(data);
  }, [data]);

  const handleAddConversationInformation = async (data) => {
    try {
      await addConversationInformation.mutateAsync(data);
      toast.success(t("add_success"), {
        autoClose: 2000,
      });
      validation.resetForm();
    } catch (error) {
      toast.success(t("add_failure"), {
        autoClose: 2000,
      });
    }
  };
  const addConversationInformation = useAddConversationInformation();
  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      cvi_title:
        (conversationInformation && conversationInformation.cvi_title) || "",
      cvi_object_id:
        (conversationInformation && conversationInformation.cvi_object_id) ||
        "",
      cvi_object_type_id:
        (conversationInformation &&
          conversationInformation.cvi_object_type_id) ||
        "",
      cvi_request_date_et:
        (conversationInformation &&
          conversationInformation.cvi_request_date_et) ||
        "",
      cvi_request_date_gc:
        (conversationInformation &&
          conversationInformation.cvi_request_date_gc) ||
        "",
      cvi_description:
        (conversationInformation && conversationInformation.cvi_description) ||
        "",
      cvi_status:
        (conversationInformation && conversationInformation.cvi_status) || "",

      is_deletable:
        (conversationInformation && conversationInformation.is_deletable) || 1,
      is_editable:
        (conversationInformation && conversationInformation.is_editable) || 1,
    },
    validationSchema: Yup.object({
      cvi_title: Yup.string().required(t("cvi_title")),
      cvi_description: Yup.string().required(t("cvi_description")),
    }),
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: (values) => {
      const newConversationInformation = {
        cvi_title: values.cvi_title,
        cvi_object_id: 2,
        cvi_object_type_id: 4,
        cvi_request_date_et: "1",
        cvi_request_date_gc: "1",
        cvi_description: values.cvi_description,
      };
      // save new ConversationInformation
      handleAddConversationInformation(newConversationInformation);
    },
  });

  const formatTimeAgo = (timestamp) => {
    return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
  };

  const comments = data?.data || []

  return (
    <React.Fragment>
      <Row>
        <Col lg={12}>
          <Card>
            <CardBody>
              <div className="row justify-content-center">
                <div className="col-xl-8">
                  <div>
                    <div>
                      <div className="">
                        <h5 className="font-size-16 mb-3">Leave a Message</h5>

                        <Form
                          onSubmit={(e) => {
                            e.preventDefault();
                            validation.handleSubmit();
                            return false;
                          }}
                        >
                          <div className="mb-3">
                            <Label>{"Subject"}</Label>
                            <Input
                              name="cvi_title"
                              type="text"
                              placeholder={"Subject"}
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.cvi_title || ""}
                              invalid={
                                validation.touched.cvi_title &&
                                  validation.errors.cvi_title
                                  ? true
                                  : false
                              }
                            />
                            {validation.touched.cvi_title &&
                              validation.errors.cvi_title ? (
                              <FormFeedback type="invalid">
                                {validation.errors.cvi_title}
                              </FormFeedback>
                            ) : null}
                          </div>

                          <div className="mb-3">
                            <Label>{"Message"}</Label>
                            <textarea
                              name="cvi_description"
                              className="form-control"
                              id="commentmessage-input"
                              rows="3"
                              type="text"
                              placeholder={"Message"}
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.cvi_description || ""}
                              invalid={
                                validation.touched.cvi_description &&
                                  validation.errors.cvi_description
                                  ? true
                                  : false
                              }
                            ></textarea>
                            {validation.touched.cvi_description &&
                              validation.errors.cvi_description ? (
                              <FormFeedback type="invalid">
                                {validation.errors.cvi_description}
                              </FormFeedback>
                            ) : null}
                          </div>

                          <Row>
                            <Col>
                              <div className="text-end">
                                {addConversationInformation.isPending ? (
                                  <Button
                                    color="success"
                                    type="submit"
                                    className="save-user"
                                    disabled={
                                      addConversationInformation.isPending ||
                                      !validation.dirty
                                    }
                                  >
                                    <Spinner
                                      size={"sm"}
                                      color="light"
                                      className="me-2"
                                    />
                                    {"Submit"}
                                  </Button>
                                ) : (
                                  <Button
                                    color="success"
                                    type="submit"
                                    className="save-user"
                                    disabled={
                                      addConversationInformation.isPending ||
                                      !validation.dirty
                                    }
                                  >
                                    {"Submit"}
                                  </Button>
                                )}
                              </div>
                            </Col>
                          </Row>
                        </Form>
                      </div>
                      <h5 className="font-size-15">
                        <i className="bx bx-message-dots text-muted align-middle me-1"></i>{" "}
                        Conversations
                      </h5>
                      <div>
                        {comments.map((comment) => (
                          <div
                            key={comment.cvi_id}
                            className="d-flex py-3 border-top"
                          >
                            <div className="flex-shrink-0 me-3">
                              <div className="avatar-xs">
                                <div className="avatar-title rounded-circle bg-light text-primary">
                                  <i className="bx bxs-user"></i>
                                </div>
                              </div>
                            </div>
                            <div className="flex-grow-1">
                              <h5 className="font-size-14 mb-1">
                                {comment.cvi_title}{" "}
                                <small className="text-muted float-end">
                                  {formatTimeAgo(comment.cvi_create_time)}
                                </small>
                              </h5>
                              <p className="text-muted">
                                {comment.cvi_description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default Conversation;
