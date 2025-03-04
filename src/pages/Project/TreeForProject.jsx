import { useEffect, useState, memo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useFetchAddressStructures } from "../../queries/address_structure_query";
import { getUserSectorListTree } from "../../queries/usersector_query";
import { useSearchProgramInfos, useFetchProgramInfos } from "../../queries/programinfo_query";
import { Tree } from "react-arborist";
import { FaFolder, FaFile, FaChevronRight, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { Card, CardBody, Input, Label, Col, Row, Button } from "reactstrap";

const AddressTree = ({ onNodeSelect, setIsAddressLoading, setInclude }) => {
  const { t, i18n } = useTranslation();
  const treeRef = useRef()
  const storedUser = JSON.parse(localStorage.getItem("authUser"));
  const userId = storedUser?.user.usr_id;
  const { data, isLoading } = useFetchAddressStructures(userId);
  const [treeData, setTreeData] = useState([]);
  const [programParam, setProgramParam] = useState({})
  const [selectedSector, setSelectedSector] = useState({})

  const [searchTerm, setSearchTerm] = useState(null)

  const { data: clusters, isLoading: isClusterLoading } = getUserSectorListTree(userId);
  const { data: prData, isLoading: isProgramLoading, refetch: refetchProgram } =
    useFetchProgramInfos(programParam, Object.keys(programParam).length > 0);

  useEffect(() => {
    setIsAddressLoading(isLoading || isClusterLoading || isProgramLoading);
  }, [isLoading, isClusterLoading, isProgramLoading, setIsAddressLoading]);

  useEffect(() => {
    if (data && clusters) {
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

  // Handle fetching programs when sector node is clicked
  const handleSectorClick = async (node) => {
    const { id, region_id, zone_id, woreda_id, s_id } = node.data;
    setProgramParam({
      pri_owner_region_id: region_id,
      pri_owner_zone_id: zone_id,
      pri_owner_woreda_id: woreda_id,
      pri_sector_id: s_id
    })
    setSelectedSector(node.data)
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: programData } = await refetchProgram();
        const { id, region_id, zone_id, woreda_id, s_id } = selectedSector
        const formatedProgram = programData?.data?.map((s) => ({
          ...s,
          id: `${woreda_id}_${s.pri_id}_program`,
          name: s.pri_name_or,
          add_name_or: s.pri_name_or,
          add_name_am: s.pri_name_am,
          add_name_en: s.pri_name_en,
          region_id: region_id,
          zone_id: zone_id,
          woreda_id: woreda_id,
          level: "program",
          children: []
        }))

        // Update tree with new program data
        const updatedTreeData = updateNodeChildren(treeData, id, 'sector', formatedProgram);
        setTreeData(updatedTreeData);
      } catch (error) {
        console.error("Error during sector refetch:", error);
      }
    };

    if (Object.keys(programParam).length > 0) {
      fetchData();
    }
  }, [programParam]);

  useEffect(() => {
    if (!prData || !selectedSector.id) return;

    const { id, region_id, zone_id, woreda_id, s_id } = selectedSector;
    const formattedProgram = prData?.data.map((s) => ({
      ...s,
      id: `${s.pri_id}_program`,
      name: s.pri_name_or,
      add_name_or: s.pri_name_or,
      add_name_am: s.pri_name_am,
      add_name_en: s.pri_name_en,
      region_id: region_id,
      zone_id: zone_id,
      woreda_id: woreda_id,
      level: "program",
      children: [],
    }));

    setTreeData((prevTreeData) => updateNodeChildren(prevTreeData, id, 'sector', formattedProgram));
  }, [prData]);

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
                onNodeSelect({ data: null })
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
              width={500}
              height={800}
              indent={24}
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


const Node = ({ node, style, dragHandle, handleSectorClick, onNodeSelect }) => {
  if (!node?.data) return null;
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
      {!isLeafNode && node.data.level !== "program" && <span className="me-2 ps-2">{chevronIcon}</span>}
      <span className={`${node.data.level === "program" ? "ms-4" : ""}  me-1 text-warning`}>{icon}</span>
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

export default AddressTree
