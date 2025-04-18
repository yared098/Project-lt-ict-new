import { useEffect, useState, memo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useFetchAddressStructures } from "../../queries/address_structure_query";
import { getUserSectorListTree } from "../../queries/usersector_query";
import { useFetchProjects, useSearchProjects } from "../../queries/project_query"
import { Tree } from "react-arborist";
import { FaFolder, FaFile, FaChevronRight, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { Card, CardBody, Input, Label, Col, Row, Button } from "reactstrap";
import useResizeObserver from "use-resize-observer";
import { v4 as uuidv4 } from 'uuid';

const INDENT_STEP = 15
const levelMap = {
  1: "program",
  2: "program",
  3: "sub_program",
  4: "output",
  5: "project"
}
const levelSymbolMap = {
  "program": "P",
  "outcome": "OC",
  "sub_program": "SP",
  "output": "O",
  "project": "PR",
  "region": "R",
  "zone": "Z",
  "woreda": "W",
  "cluster": "C",
  "sector": "S"
}

const updateNodeChildren = (treeData, parentId, level, newChildren) => {
  return treeData.map((region) => {
    if (region.id === parentId && region.level === level) {
      const existingChildrenMap = new Map(region.children.map((child) => [child.id, child]));

      const newChildrenIds = new Set(newChildren.map((child) => child.id));

      const updatedChildren = newChildren.map((newChild) => {
        if (existingChildrenMap.has(newChild.id)) {
          return {
            ...existingChildrenMap.get(newChild.id),
            ...newChild,
          };
        }
        return newChild;
      });

      for (const [id, child] of existingChildrenMap) {
        if (!newChildrenIds.has(id)) {
          continue;
        }
        if (!newChildren.some((newChild) => newChild.id === id)) {
          updatedChildren.push(child);
        }
      }
      return {
        ...region,
        children: updatedChildren,
      };
    }

    if (region.children) {
      region.children = updateNodeChildren(region.children, parentId, level, newChildren);
    }

    return region;
  });
};

const formatProjectNode = (project, context = {}) => {
  const {
    woreda_id = '',
    region_id = '',
    zone_id = '',
  } = context;

  return {
    ...project,
    id: `${woreda_id}_${uuidv4()}`,
    name: project.prj_name_or,
    add_name_or: project.prj_name_or,
    add_name_am: project.prj_name_am,
    add_name_en: project.prj_name_en,
    region_id,
    zone_id,
    woreda_id,
    level: levelMap[project.prj_object_type_id] || "unknown",
    children: (project.children || [])
      .filter(child => child.prj_object_type_id !== 5)
      .map(child => formatProjectNode(child, context)),
  };
};


const AddressTree = ({ onNodeSelect }) => {
  const { t, i18n } = useTranslation();
  const treeRef = useRef()
  const storedUser = JSON.parse(localStorage.getItem("authUser"));
  const userId = storedUser?.user.usr_id;
  const { data, isLoading, isError } = useFetchAddressStructures(userId);
  const [treeData, setTreeData] = useState([]);
  const [projectParams, setProjectParams] = useState({})

  const [selectedSector, setSelectedSector] = useState({})
  const { ref, width, height } = useResizeObserver();
  const [searchTerm, setSearchTerm] = useState(null)

  const { data: clusters, isLoading: isClusterLoading, isError: isClusterError } = getUserSectorListTree(userId);
  const { data: projects, isLoading: isProjectsLoading, refetch: refetchProjects } =
    useSearchProjects(projectParams, Object.keys(projectParams).length > 0);

  useEffect(() => {
    if (data && clusters) {
      const transformData = (regions) =>
        regions.map((region) => ({
          ...region,
          id: region.id?.toString() || uuidv4(),
          children: region.children
            ? region.children.map((zone) => ({
              ...zone,
              id: zone.id?.toString() || uuidv4(),
              children: zone.children
                ? zone.children.map((woreda) => ({
                  ...woreda,
                  id: woreda.id?.toString() || uuidv4(),
                  children: [
                    ...woreda.children,
                    ...clusters.map((c) => ({
                      id: `${region.id}_${zone.id}_${woreda.id}_${c.psc_id}`,
                      c_id: c.psc_id,
                      name: c.psc_name,
                      add_name_en: c.psc_name,
                      add_name_am: c.psc_name,
                      add_name_or: c.psc_name,
                      region_id: region.id,
                      zone_id: zone.id,
                      woreda_id: woreda.id,
                      level: "cluster",
                      children: c.children.map((s) => ({
                        id: `${woreda.id}_${s.sci_id}_sector`,
                        s_id: s.sci_id,
                        name: s.sci_name_or,
                        add_name_en: s.sci_name_en,
                        add_name_or: s.sci_name_or,
                        add_name_am: s.sci_name_am,
                        region_id: region.id,
                        zone_id: zone.id,
                        woreda_id: woreda.id,
                        level: "sector",
                        children: []
                      }))
                    })),
                  ],
                }))
                : [],
            }))
            : [],
        }));
      setTreeData(transformData(data));
    }
  }, [data, clusters]);

  // Handle fetching projects when sector node is clicked
  const handleSectorClick = async (node) => {
    const { id, region_id, zone_id, woreda_id, s_id } = node.data;
    setProjectParams({
      prj_owner_region_id: region_id,
      prj_owner_zone_id: zone_id,
      prj_owner_woreda_id: woreda_id,
      prj_sector_id: s_id
    })
    setSelectedSector(node.data)
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: projectsData } = await refetchProjects();
        const { id, region_id, zone_id, woreda_id } = selectedSector;

        const formattedProjects = projectsData?.data?.map((p) =>
          formatProjectNode(p, { region_id, zone_id, woreda_id })
        );

        const updatedTreeData = updateNodeChildren(treeData, id, 'sector', formattedProjects);
        setTreeData(updatedTreeData);
      } catch (error) {
        console.error("Error during sector refetch:", error);
      }
    };

    if (Object.keys(projectParams).length > 0) {
      fetchData();
    }
  }, [projectParams]);

  useEffect(() => {
    if (!projects || !selectedSector.id) return;

    const { id, region_id, zone_id, woreda_id, s_id } = selectedSector;
    const formattedProjects = projects?.data?.map((p) =>
      formatProjectNode(p, { region_id, zone_id, woreda_id })
    );
    setTreeData((prevTreeData) => updateNodeChildren(prevTreeData, id, 'sector', formattedProjects));
  }, [projects]);

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

  if (isLoading || isClusterLoading) {
    return (
      <div
        style={{ minHeight: "100vh", minWidth: "250px" }}
        className="w-20 flex-shrink-0 p-3 border-end overflow-auto shadow-sm"
      >
        <h5 className="">{t("address_tree_Search")}</h5>
        <hr className="" />
        <p>Loading...</p>
      </div>
    );
  }
  if (isError || isClusterError) {
    return (
      <div
        style={{ minHeight: "100vh", minWidth: "250px" }}
        className="w-20 flex-shrink-0 p-3 border-end overflow-auto shadow-sm"
      >
        <h5 className="">{t("address_tree_Search")}</h5>
        <hr className="" />
        <p>Error Fetching address structure</p>
      </div>
    )
  }

  return (
    <Card className="border shadow-sm">
      <CardBody className="p-3">
        <h5 className="">{t("address_tree_Search")}</h5>
        <hr className="my-2" />
        <Row className="d-flex align-items-center justify-content-between mb-1">
          <Col className="d-flex gap-2" >
            <Input id="searchterm" name="searchterm" type="text" bsSize="sm" placeholder="search" onChange={handleSearchTerm} />
            <Button
              onClick={() => {
                onNodeSelect({ data: null })
                treeRef.current?.closeAll()
              }}
              size="sm" color="secondary-subtle" className="border">
              <FaChevronUp size={15} className="my-auto" />
            </Button>
          </Col>
        </Row>
        <div ref={ref} className="border rounded p-2 overflow-auto" style={{ minHeight: "100vh" }}>
          {treeData.length > 0 && width && height && (
            <Tree
              initialData={treeData}
              openByDefault={false}
              searchTerm={searchTerm}
              searchMatch={(node, term) => searchMatch(node, term, i18n.language)}
              ref={treeRef}
              width={Math.max(width || 450, 450)}
              height={height || 800}
              indent={INDENT_STEP}
              rowHeight={36}
              overscanCount={1}
            >
              {({ node, style, dragHandle }) => (
                <Node
                  node={node}
                  style={style}
                  dragHandle={dragHandle}
                  handleSectorClick={handleSectorClick}
                  onNodeSelect={onNodeSelect}
                />
              )}
            </Tree>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

const Node = ({ node, style, dragHandle, handleSectorClick, onNodeSelect }) => {
  if (!node?.data) return null;
  const indentSize = Number.parseFloat(`${style.paddingLeft || 0}`);
  const { i18n } = useTranslation();
  const lang = i18n.language
  const isLeafNode = node.isLeaf;
  const icon = isLeafNode ? <FaFile /> : <FaFolder />;
  const chevronIcon = node.isOpen ? <FaChevronDown /> : <FaChevronRight />;

  const handleNodeClick = (node) => {
    node.toggle();
    onNodeSelect(node);

    if (node.data.level === "sector") {
      handleSectorClick(node);
    }
  };

  return (
    <div
      onClick={() => handleNodeClick(node)}
      style={{ ...style, display: "flex" }}
      ref={dragHandle}
      className={`${node.isSelected ? "bg-info-subtle" : ""} py-1 rounded hover-zoom`}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: -1,
          display: "flex",
          alignItems: "flex-start",
          height: "100%",
        }}
      >
        {new Array(indentSize / INDENT_STEP).fill(0).map((_, index) => (
          <div
            key={index}
            style={{
              height: "100%",
              paddingLeft: "10px",
              borderRight: "1px solid #ccc",
              marginRight: "4px",
            }}
          ></div>
        ))}
      </div>
      {!isLeafNode && node.data.level !== "output" && <span className="me-2 ps-2">{chevronIcon}</span>}
      <span className={`${node.data.level === "output" ? "ms-4" : ""}  me-1 text-warning`}>{icon}</span>
      <span className="text-danger my-auto px-1" style={{ fontWeight: 900 }}>
        {levelSymbolMap[node.data.level] || ""}
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

export default AddressTree
