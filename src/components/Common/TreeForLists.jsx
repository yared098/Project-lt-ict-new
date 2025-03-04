import { useEffect, useState, memo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useFetchAddressStructures } from "../../queries/address_structure_query";
import { Tree } from "react-arborist";
import { FaFolder, FaFile, FaChevronRight, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { Card, CardBody, Input, Label, Col, Row, Button } from "reactstrap";

const TreeForLists = ({ onNodeSelect, setIsAddressLoading, setInclude }) => {
  const { t, i18n } = useTranslation();
  const treeRef = useRef()
  const storedUser = JSON.parse(localStorage.getItem("authUser"));
  const userId = storedUser?.user.usr_id;
  const { data, isLoading, isError } = useFetchAddressStructures(userId);
  const [treeData, setTreeData] = useState([]);
  const [searchTerm, setSearchTerm] = useState(null)

  useEffect(() => {
    setIsAddressLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (data) {
      const transformData = (regions) =>
        regions.map((region) => ({
          ...region,
          id: region.id?.toString() || crypto.randomUUID(),
          children: region.children
            ? region.children.map((zone) => ({
              ...zone,
              id: zone.id?.toString() || crypto.randomUUID(),
              children: zone.children
                ? zone.children.map((woreda) => ({
                  ...woreda,
                  id: woreda.id?.toString() || crypto.randomUUID(),
                }))
                : [],
            }))
            : [],
        }));

      setTreeData(transformData(data));
    }
  }, [data]);

  const handleCheckboxChange = (e) => {
    if (setInclude) {
      setInclude(e.target.checked ? 1 : 0);
    }
  };

  const handleSearchTerm = (e) => {
    setSearchTerm(e.target.value)
  }

  const searchMatch = useCallback((node, term, lang) => {
    if (!term) return true;
    const searchTerm = term.toLowerCase();
    const getNodeName = (node) => {
      if (!node?.data) return "";
      if (lang === "en" && node.data.add_name_en) return node.data.add_name_en.toLowerCase();
      if (lang === "am" && node.data.add_name_am) return node.data.add_name_am.toLowerCase();
      return node.data.name?.toLowerCase() || "";
    };
    const nameExists = (currentNode) => {
      if (getNodeName(currentNode).includes(searchTerm)) {
        return true;
      }
      if (currentNode.parent) {
        return nameExists(currentNode.parent);
      }
      return false;
    };
    return nameExists(node);
  }, []);

  if (isLoading) {
    return (
      <div
        style={{ minHeight: "450px" }}
        className="w-20 flex-shrink-0 p-3 bg-white border-end overflow-auto shadow-sm"
      >
        <h4 className="mb-2 text-secondary">{t("address_tree_Search")}</h4>
        <hr className="text-dark" />
        <p>Loading...</p>
      </div>
    );
  }
  if (isError) {
    return <div>Error fetching address structure</div>;
  }

  return (
    <Card className="border shadow-sm" style={{ minWidth: '400px' }}>
      <CardBody className="p-3">
        <h5 className="text-secondary">{t("address_tree_Search")}</h5>
        <hr />
        <Row className="d-flex align-items-center justify-content-between mb-3">
          <Col className="d-flex align-items-center gap-2 my-auto">
            <Input className="" id="include" name="include" type="checkbox" onChange={handleCheckboxChange} />
            <Label for="include" className="my-auto">{t('include_sub_address')}</Label>
          </Col>
          <Col className="d-flex gap-2" >
            <Input id="searchterm" name="searchterm" type="text" bsSize="sm" placeholder="search" onChange={handleSearchTerm} />
            <Button
              onClick={() => {
                onNodeSelect({})
                treeRef.current?.closeAll()
              }}
              size="sm" outline color="secondary-subtle">
              <FaChevronUp size={15} className="my-auto" />
            </Button>
          </Col>
        </Row>
        <div className="border rounded p-2 overflow-auto" style={{ minHeight: "350px" }}>
          {treeData.length > 0 && (
            <Tree
              initialData={treeData}
              openByDefault={false}
              searchTerm={searchTerm}
              searchMatch={(node, term) => searchMatch(node, term, i18n.language)}
              ref={treeRef}
              width={400}
              height={700}
              indent={24}
              rowHeight={36}
              overscanCount={1}
            >
              {({ node, style, dragHandle }) => (
                <Node
                  node={node}
                  style={style}
                  dragHandle={dragHandle}
                  onNodeSelect={onNodeSelect}
                />
              )}
            </Tree>
          )}
        </div>
        <style>
          {`
            /* Custom scrollbar */
            div::-webkit-scrollbar {
              width: 6px;
              height: 6px;
            }
            div::-webkit-scrollbar-thumb {
              background: rgba(0, 0, 0, 0.3);
              border-radius: 3px;
            }
            div::-webkit-scrollbar-track {
              background: rgba(0, 0, 0, 0.1);
            }
          `}
        </style>
      </CardBody>
    </Card>
  );
};


const Node = ({ node, style, dragHandle, onNodeSelect }) => {
  if (!node?.data) return null;
  const { i18n } = useTranslation();
  const lang = i18n.language
  const isLeafNode = node.isLeaf;
  const icon = isLeafNode ? <FaFile /> : <FaFolder />;
  const chevronIcon = node.isOpen ? <FaChevronDown /> : <FaChevronRight />;

  const handleNodeClick = (node) => {
    node.toggle();
    onNodeSelect(node.data);
  };

  return (
    <div
      onClick={() => handleNodeClick(node)}
      style={{ ...style, display: "flex" }}
      ref={dragHandle}
      className={`${node.isSelected ? "bg-info-subtle" : ""} py-1 rounded hover-zoom`}
    >
      {!isLeafNode && node.data.level !== "woreda" && <span className="me-2 ps-2">{chevronIcon}</span>}
      <span className={`${node.data.level === "woreda" ? "ms-4" : ""}  me-1 text-warning`}>{icon}</span>
      <span className="text-danger my-auto px-1" style={{ fontWeight: 900 }}>
        {node.data.level.charAt(0).toUpperCase()}
      </span>
      <span
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "100%",
          display: "inline-block",
          verticalAlign: "middle",
        }}
      >
        {lang === "en" && node.data.add_name_en
          ? node.data.add_name_en
          : lang === "am" && node.data.add_name_am
            ? node.data.add_name_am
            : node.data.name}
      </span>
    </div>
  );
};

export default TreeForLists