package com.howell.examvault.base.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;

import com.howell.examvault.base.BaseIntegrationTest;
import com.howell.examvault.base.exception.UnauthorizedException;

@TestPropertySource(properties = {
    "spring.security.oauth2.client.registration.google.client-id=test",
    "spring.security.oauth2.client.registration.google.client-secret=test"
})
class CommentServiceSecurityTest extends BaseIntegrationTest {

    @Autowired
    private CommentService commentService;

    @Test
    @WithAnonymousUser
    @DisplayName("Should deny anonymous access to protected methods")
    void shouldDenyAnonymousAccessToProtectedMethods() {
        // When & Then
        assertThatThrownBy(() -> commentService.addComment("exam-id", "comment", 5))
                .isInstanceOf(UnauthorizedException.class);
        
        assertThatThrownBy(() -> commentService.updateComment("exam-id", "comment-id", "new text", 4))
                .isInstanceOf(UnauthorizedException.class);
        
        assertThatThrownBy(() -> commentService.deleteComment("exam-id", "comment-id"))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @WithMockUser
    @DisplayName("Should allow authenticated access to public methods")
    void shouldAllowAuthenticatedAccessToPublicMethods() {
        // This should not throw AccessDeniedException
        // (it might throw other exceptions due to invalid data, but not security exceptions)
        try {
            commentService.getExamComments("invalid-exam-id");
        } catch (Exception e) {
            // Should be validation error, not access denied
            assertThat(e).isNotInstanceOf(UnauthorizedException.class);
        }
    }
}