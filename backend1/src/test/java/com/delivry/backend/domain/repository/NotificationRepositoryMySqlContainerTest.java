package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.entity.Notification;
import com.delivry.backend.domain.entity.Role;
import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.enums.UserStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers(disabledWithoutDocker = true)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class NotificationRepositoryMySqlContainerTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0.36")
            .withDatabaseName("delivery_app_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
        registry.add("spring.datasource.driver-class-name", mysql::getDriverClassName);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    }

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private NotificationRepository notificationRepository;

    @Test
    void markAllReadByUserId_updatesRowsInContainerDatabase() {
        User user = persistUser("container@test.by");

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle("container");
        notification.setStatusNotification(0);
        notification.setCreatedAt(LocalDateTime.now());
        entityManager.persist(notification);
        entityManager.flush();

        notificationRepository.markAllReadByUserId(user.getId());
        entityManager.clear();

        Notification reloaded = notificationRepository.findById(notification.getId()).orElseThrow();
        assertThat(reloaded.getStatusNotification()).isEqualTo(1);
    }

    private User persistUser(String email) {
        Role role = new Role();
        role.setName("LOGIST");
        entityManager.persist(role);

        UserStatus status = new UserStatus();
        status.setName("Активен");
        entityManager.persist(status);

        User user = new User();
        user.setRole(role);
        user.setStatus(status);
        user.setEmail(email);
        user.setFullName("Container User");
        entityManager.persist(user);
        entityManager.flush();
        return user;
    }
}
