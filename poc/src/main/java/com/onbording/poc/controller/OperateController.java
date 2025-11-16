package com.onbording.poc.controller;

import com.onbording.poc.service.OperateService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/process-instances")
public class OperateController {
    private final OperateService client;

    public OperateController(OperateService client) {
        this.client = client;
    }

    @GetMapping
    public Map<String, Object> list(@RequestParam(defaultValue = "20") int size) {
        return client.searchActiveInstances(size);
    }

    @GetMapping("/{processInstanceKey}/variables")
    public Map<String, Object> variables(@PathVariable Long processInstanceKey) {
        return client.getVariables(processInstanceKey);
    }

    @GetMapping(value = "/{key}/diagram.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> diagramXml(@PathVariable long key) {
        String xml = client.fetchProcessXml(key);
        return ResponseEntity.ok(xml);
    }

    @PostMapping(value = "/message/{messageName}/{correlationKey}")
    public void message(@PathVariable String messageName, @PathVariable String correlationKey) {
        client.sendMessage(messageName, correlationKey);

    }

    @GetMapping(value = "/{key}")
    public Map<String, Object> getProcessDetailFlowNode(@PathVariable long key) {
        return client.getProcessDetailFlowNode(key);

    }

    @GetMapping(value = "/{key}/sequence-flows")
    public List<String> getSequenceFlows(@PathVariable long key) {
        return client.getSequenceFlows(key);

    }

    @GetMapping(value = "/{key}/statistics")
    public List<Object> getProcessInstanceStatistics(@PathVariable long key){
        return client.getProcessInstanceStatistics(key);
    }

}
