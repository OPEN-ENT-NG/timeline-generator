MERGE (a:Action {displayName:"timelinegenerator.print",name:"net.atos.entng.timelinegenerator.controllers.TimelineController|printView",type:"SECURED_ACTION_WORKFLOW"})
WITH a
MATCH (b:Action{name:"net.atos.entng.timelinegenerator.controllers.TimelineController|view"})<-[:AUTHORIZE]-(ro:Role)
WITH a,ro
MERGE (a)<-[:AUTHORIZE]-(ro);