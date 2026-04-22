package com.delivry.backend.controller;

import com.delivry.backend.application.service.LogistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class LogistControllerWebMvcTest {

    private MockMvc mockMvc;

    @Mock
    private LogistService logistService;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new LogistController(logistService)).build();
    }

    @Test
    void getNotifications_returnsPayloadFromService() throws Exception {
        when(logistService.getNotifications()).thenReturn(List.of(
                notification(1L, "Новый маршрут", "Маршрут назначен"),
                notification(2L, "Пробки", "Есть задержки")
        ));

        mockMvc.perform(get("/api/logist/notifications").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Новый маршрут"))
                .andExpect(jsonPath("$[1].message").value("Есть задержки"));
    }

    private com.delivry.backend.response.client.NotificationResponse notification(Long id, String title, String message) {
        return new com.delivry.backend.response.client.NotificationResponse() {
            @Override public Long getId() { return id; }
            @Override public String getTitle() { return title; }
            @Override public String getMessage() { return message; }
            @Override public Integer getStatusNotification() { return 0; }
            @Override public java.time.LocalDateTime getCreatedAt() { return java.time.LocalDateTime.now(); }
        };
    }
}
