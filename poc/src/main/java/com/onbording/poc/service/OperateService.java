package com.onbording.poc.service;

import io.camunda.zeebe.client.ZeebeClient;
import io.camunda.zeebe.client.api.search.response.FlowNodeInstance;
import io.camunda.zeebe.client.api.search.response.SearchQueryResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class OperateService {

    private final RestClient operateRestClient;
    private final KeycloakTokenService tokens;

    @Autowired
    ZeebeClient zeebeClient;

    public OperateService(
            @Value("${camunda.client.operate.base-url}") String operateBaseUrl,
            KeycloakTokenService tokens
    ) {
        this.operateRestClient = RestClient.builder()
                .baseUrl(operateBaseUrl)
                .build();
        this.tokens = tokens;
    }

    public Map<String, Object> searchActiveInstances(int size) {
        String token = tokens.getAccessToken();

        Map<String, Object> body = Map.of(
                "size", size,
                "sort", List.of(Map.of(
                        "field", "startDate",
                        "order", "DESC"
                ))
        );

        return operateRestClient.post()
                .uri("/v1/process-instances/search")
                .headers(h -> h.setBearerAuth(token))
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
    }

    public Map<String, Object> getVariables(Long processInstanceKey) {
        String token = tokens.getAccessToken();

        Map<String, Object> body = Map.of(
                "size", 50, // adjust as needed
                "filter", Map.of(
                        "processInstanceKey", processInstanceKey
                ),
                "sort", List.of(Map.of(
                        "field", "name",
                        "order", "ASC"
                ))
        );

        return operateRestClient.post()
                .uri("/v1/variables/search")
                .headers(h -> h.setBearerAuth(token))
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
    }

    public String fetchProcessXml(long processDefinitionKey) {
        String token = tokens.getAccessToken();
        return operateRestClient.get()
                .uri("/v1/process-definitions/{key}/xml", processDefinitionKey) // try v1 first
                .headers(h -> h.setBearerAuth(token))
                .retrieve()
                .body(String.class);
    }

    public void sendMessage(String messageName,String correlationKey){
         zeebeClient
                .newCorrelateMessageCommand()
                .messageName(messageName)
                .correlationKey(correlationKey)
                .send().join()
                ;
    }

    public Map<String,Object> getProcessDetailFlowNode(Long processInstanceKey){
        String token= tokens.getAccessToken();
        Map<String,Object>body=Map.of(
                "filter",Map.of(
                        "processInstanceKey",processInstanceKey
                )
        );

        return operateRestClient.post()
                .uri("/v1/flownode-instances/search")
                .headers(h->h.setBearerAuth(token))
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
    }

    public List<String> getSequenceFlows(Long processInstanceKey){
        String token=tokens.getAccessToken();
        return operateRestClient.get()
                .uri("v1/process-instances/"+processInstanceKey+"/sequence-flows")
                .headers(h->h.setBearerAuth(token))
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
    }

    public List<Object> getProcessInstanceStatistics(Long processInstanceKey){
        String token=tokens.getAccessToken();
        return  operateRestClient.get()
                .uri("v1/process-instances/"+processInstanceKey+"/statistics")
                .headers(h->h.setBearerAuth(token))
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
    }

}
