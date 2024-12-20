import React, { useEffect } from 'react';
import gantt from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import './gantt.css';
import { Card } from "reactstrap";

const GanttChart = ({ data} ) => {
  
  
 // gantt.config.drag_mode= "move"; // Enable moving tasks
     // gantt.config.drag_project= true; // Allow dragging parent tasks
      //gantt.config.drag_links= true;
    // Configure date format
    gantt.config.date_format = "%Y-%m-%d %H:%i:%s";

    // Lightbox Configuration
    gantt.config.lightbox.sections = [
      { name: "description", height: 38, map_to: "text", type: "textarea", focus: true },
      { 
        name: "priority", 
        height: 22, 
        map_to: "priority", 
        type: "select", 
        options: [
          { key: 1, label: "High" },
          { key: 2, label: "Medium" },
          { key: 3, label: "Low" }
        ]
      },
      { name: "note", height: 38, map_to: "note", type: "textarea" },
      { name: "time", type: "duration", map_to: "auto" }
    ];

    // Customize columns with Add Icon in header
    gantt.config.columns = [
      {
        name: "text",
        label: `<span>Project Name <span>`,
        width: "*",
        tree: true
      },
      { name: "start_date", label: "Start time", align: "center", width: 90 },
      { name: "duration", label: "Duration", align: "center", width: 70 },
      {
        name: "actions",
        label: `<span>Add <span class="gantt_add_task p-2" title="Add Task">+</span></span>`,
        width: 120,
        template: (task) => {
          return `
            <span class="gantt_action gantt_action_add p-1" data-id="${task.id}" title="Add Task">+</span>
            <span class="gantt_action gantt_action_update p-1" data-id="${task.id}" title="Edit Task">✎</span>
            <span class="gantt_action gantt_action_delete p-1" data-id="${task.id}" title="Delete Task">✖</span>
          `;
        },
      }
    ];


    // Event delegation for custom icons in header and row
    gantt.attachEvent("onGanttRender", () => {
      // Event for the "Add Task" button in the header
      document.querySelector(".gantt_add_task")?.addEventListener("click", () => {
        const newId = gantt.addTask({ text: "New Project", start_date: new Date(), duration: 1 ,project_plan_id:data.pld_id});
        gantt.showLightbox(newId);
      });

      // Event delegation for icons (add, update, delete) in task rows
      document.querySelectorAll('.gantt_action').forEach((icon) => {
        icon.addEventListener('click', (e) => {
          const id = Number(e.target.getAttribute("data-id"));
          const action = e.target.classList.contains("gantt_action_delete") 
            ? "delete" 
            : e.target.classList.contains("gantt_action_update")
              ? "update"
              : "addsub";
          
          if (action === "delete") {
            gantt.deleteTask(id);
          } else if (action === "update") {
            gantt.showLightbox(id);
          } else if (action === "addsub") {
            const newId = gantt.addTask({ text: "New Child Project", start_date: new Date(), duration: 1, parent: id ,project_plan_id:data.pld_id});
            gantt.showLightbox(newId);
          }
        });
      });
    });

   

    // Set up DataProcessor to handle backend interaction
    const dp = gantt.createDataProcessor((entity, action, data, id) => {
      let url = "";
      let method = "";
      if (action === "update") action = "updated";
      if (action === "delete") action = "deleted";
      // Handle different actions
      if (action === "inserted" || action === "create") { // Handle create as inserted
        url = "https://pms.awashsol.com/api/task";
        method = "POST";
      } else if (action === "updated" || action === "update") {  // Handle both update and updated actions
        url = `https://pms.awashsol.com/api/task/${id}`;
        method = "PUT";
      } else if (action === "deleted" || action === "delete") {
        url = `https://pms.awashsol.com/api/task/${id}`;
        method = "DELETE";
      } else {
        console.error(`Unhandled action: ${action}`);
        return Promise.reject(`Unhandled action: ${action}`); // Gracefully handle unknown actions
      }

      return fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((response) => response.json())
        .then((res) => {
          //dp.setUpdated(id, true, action);
        })
        .catch((error) => {
          //dp.setUpdated(id, false, action);
          console.error("DataProcessor error:", error);
        });
    });

    
    useEffect(() => {
       gantt.init("gantt_here",{
      drag_mode: "move", // Enable drag and drop for tasks
    });

    // Load tasks from the backend (make sure your API endpoint works)
    gantt.load(`https://pms.awashsol.com/api/data?project_plan_id=${data.pld_id}`, function(data) {
      console.log("Loaded data:", data); // Inspect the structure here
    });
    return () => {
      gantt.clearAll();
    };
  }, [data]);
  return (
    <div style={{ width: '100%',paddingTop:"20px", height: '100%' }}>
      <div>
        <Card style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <h3 className="p-2" style={{ textAlign: 'center' }}>Selected project plan: {data?.pld_name || ""}</h3>
        </Card>
      </div>
      <div id="gantt_here" style={{ width: '100%', height: '600px' }}></div>
    </div>
  );
};
export default GanttChart;
