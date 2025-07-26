package com.howell.examvault.base.service;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import com.howell.examvault.base.security.UserDetails;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.flow.spring.security.AuthenticationContext;
import com.vaadin.hilla.BrowserCallable;

@BrowserCallable
@Service
public class UserService {

    private final AuthenticationContext authContext;

    public UserService(AuthenticationContext authContext) {
        this.authContext = authContext;
    }

    /**
     * Get the currently authenticated user's details This method is safe to
     * call from anywhere, including unauthenticated contexts
     */
    @AnonymousAllowed
    public UserDetails getAuthenticatedUser() {
        try {

            Authentication springAuth = SecurityContextHolder.getContext().getAuthentication();

            // Check if it's an anonymous authentication
            if (springAuth instanceof AnonymousAuthenticationToken) {
                return null;
            }

            return authContext.getAuthenticatedUser(OidcUser.class)
                    .map(oidcUser -> {
                        return new UserDetails(
                                oidcUser.getEmail(),
                                oidcUser.getFullName(),
                                oidcUser.getPicture(),
                                oidcUser.getSubject()
                        );
                    })
                    .orElse(null);
        } catch (Exception e) {
            // Log the error but don't throw - this prevents cascade failures
            System.err.println("Error getting authenticated user: " + e.getMessage());
            return null;
        }
    }

    /**
     * Check if the current user is authenticated This is the safest method to
     * check auth status
     */
    @AnonymousAllowed
    public boolean isAuthenticated() {
        try {

            Authentication springAuth = SecurityContextHolder.getContext().getAuthentication();

            // Check if it's an anonymous authentication
            if (springAuth instanceof AnonymousAuthenticationToken) {
                return false;
            }

            boolean isAuth = authContext.getAuthenticatedUser(OidcUser.class).isPresent();
            return isAuth;

        } catch (Exception e) {
            // Log the error but don't throw
            System.err.println("Error checking authentication: " + e.getMessage());
            return false;
        }
    }

    /**
     * Get user profile information (requires authentication) This method should
     * only be called when you're sure the user is authenticated
     */
    public UserDetails getUserProfile() {
        return authContext.getAuthenticatedUser(OidcUser.class)
                .map(oidcUser -> new UserDetails(
                oidcUser.getEmail(),
                oidcUser.getFullName(),
                oidcUser.getPicture(),
                oidcUser.getSubject()
        ))
                .orElseThrow(() -> new SecurityException("User not authenticated"));
    }
}
