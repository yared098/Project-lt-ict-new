import React from "react";
import { Form, Label, Input, Card, CardBody, Col, Row } from "reactstrap";
import avtar1 from "../../assets/images/users/avatar-2.jpg";

const Conversation = (props) => {
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
                          onSubmit={(event) => event.preventDefault()}
                          className="mb-3"
                        >
                          <div className="mb-3">
                            <textarea
                              className="form-control"
                              id="commentmessage-input"
                              placeholder="Your message..."
                              rows="3"
                            ></textarea>
                          </div>

                          <div className="text-end">
                            <button
                              type="submit"
                              className="btn btn-success w-sm"
                            >
                              Submit
                            </button>
                          </div>
                        </Form>
                      </div>
                      <h5 className="font-size-15">
                        <i className="bx bx-message-dots text-muted align-middle me-1"></i>{" "}
                        Conversations :
                      </h5>
                      <div>
                        <div className="d-flex py-3">
                          <div className="flex-shrink-0 me-3">
                            <div className="avatar-xs">
                              <div className="avatar-title rounded-circle bg-light text-primary">
                                <i className="bx bxs-user"></i>
                              </div>
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <h5 className="font-size-14 mb-1">
                              Delores Williams{" "}
                              <small className="text-muted float-end">
                                1 hr Ago
                              </small>
                            </h5>
                            <p className="text-muted">
                              If several languages coalesce, the grammar of the
                              resulting language is more simple and regular than
                              that of the individual
                            </p>
                          </div>
                        </div>
                        <div className="d-flex py-3 border-top">
                          <div className="flex-shrink-0 me-3">
                            <div className="avatar-xs">
                              <img
                                src={avtar1}
                                alt=""
                                className="img-fluid d-block rounded-circle"
                              />
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <h5 className="font-size-14 mb-1">
                              Clarence Smith{" "}
                              <small className="text-muted float-end">
                                2 hrs Ago
                              </small>
                            </h5>
                            <p className="text-muted">
                              Neque porro quisquam est, qui dolorem ipsum quia
                              dolor sit amet
                            </p>

                            <div className="d-flex pt-3">
                              <div className="flex-shrink-0 me-3">
                                <div className="avatar-xs">
                                  <div className="avatar-title rounded-circle bg-light text-primary">
                                    <i className="bx bxs-user"></i>
                                  </div>
                                </div>
                              </div>
                              <div className="flex-grow-1">
                                <h5 className="font-size-14 mb-1">
                                  Silvia Martinez{" "}
                                  <small className="text-muted float-end">
                                    2 hrs Ago
                                  </small>
                                </h5>
                                <p className="text-muted">
                                  To take a trivial example, which of us ever
                                  undertakes laborious physical exercise
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex py-3 border-top">
                          <div className="flex-shrink-0 me-3">
                            <div className="avatar-xs">
                              <div className="avatar-title rounded-circle bg-light text-primary">
                                <i className="bx bxs-user"></i>
                              </div>
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <h5 className="font-size-14 mb-1">
                              Keith McCoy{" "}
                              <small className="text-muted float-end">
                                12 Aug
                              </small>
                            </h5>
                            <p className="text-muted">
                              Donec posuere vulputate arcu. phasellus accumsan
                              cursus velit
                            </p>
                          </div>
                        </div>
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
