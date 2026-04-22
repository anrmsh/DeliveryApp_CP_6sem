package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.entity.Notification;
import com.delivry.backend.domain.entity.Role;
import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.enums.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.datasource.url=jdbc:h2:mem:testdb;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1"
})
class NotificationRepositoryDataJpaTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void createSchema() {
        jdbcTemplate.execute("drop table if exists notification");
        jdbcTemplate.execute("drop table if exists `user`");
        jdbcTemplate.execute("drop table if exists user_status");
        jdbcTemplate.execute("drop table if exists `role`");

        jdbcTemplate.execute("create table `role` (id bigint auto_increment primary key, name varchar(100) not null)");
        jdbcTemplate.execute("create table user_status (id bigint auto_increment primary key, name varchar(100) not null)");
        jdbcTemplate.execute("""
                create table `user` (
                    id bigint auto_increment primary key,
                    role_id bigint not null,
                    status_id bigint not null,
                    email varchar(255) not null,
                    password_hash varchar(255),
                    full_name varchar(255) not null,
                    phone varchar(30),
                    oauth_provider varchar(100),
                    oauth_id varchar(255),
                    created_at timestamp,
                    constraint fk_user_role foreign key (role_id) references `role`(id),
                    constraint fk_user_status foreign key (status_id) references user_status(id)
                )
                """);
        jdbcTemplate.execute("""
                create table notification (
                    id bigint auto_increment primary key,
                    user_id bigint not null,
                    title varchar(255),
                    message varchar(255),
                    status_notification integer,
                    created_at timestamp,
                    constraint fk_notification_user foreign key (user_id) references `user`(id)
                )
                """);
    }

    @Test
    void findByUserIdOrderByCreatedAtDesc_returnsNewestFirst() {
        User user = persistUser("logist@test.by");

        Notification older = new Notification();
        older.setUser(user);
        older.setTitle("older");
        older.setStatusNotification(0);
        older.setCreatedAt(LocalDateTime.now().minusHours(2));
        entityManager.persist(older);

        Notification newer = new Notification();
        newer.setUser(user);
        newer.setTitle("newer");
        newer.setStatusNotification(0);
        newer.setCreatedAt(LocalDateTime.now());
        entityManager.persist(newer);
        entityManager.flush();

        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        assertThat(notifications).hasSize(2);
        assertThat(notifications.get(0).getTitle()).isEqualTo("newer");
        assertThat(notificationRepository.countByUserIdAndStatusNotification(user.getId(), 0)).isEqualTo(2);
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
        user.setFullName("Test Logist");
        entityManager.persist(user);
        entityManager.flush();
        return user;
    }

}
