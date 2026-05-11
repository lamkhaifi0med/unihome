package com.unihome.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@SpringBootTest(properties = {
        "spring.jpa.hibernate.ddl-auto=none",
        "app.confirmation.base-url=http://localhost:8080/api/auth/confirm?token={token}",
        "app.mail.from=no-reply@unihome.local"
})
@Import(UnihomeApiApplicationTests.TestMailConfig.class)
class UnihomeApiApplicationTests {

    @Test
    void contextLoads() {
    }

    @TestConfiguration
    static class TestMailConfig {
        @Bean
        public JavaMailSender javaMailSender() {
            // Use a no-op sender for context initialization during tests.
            return new JavaMailSenderImpl();
        }
    }
}
