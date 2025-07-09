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
     * Get the currently authenticated user's details
     * This method is safe to call from anywhere, including unauthenticated contexts
     */
    @AnonymousAllowed
    public UserDetails getAuthenticatedUser() {
        try {
            // Debug logging
            Authentication springAuth = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("=== DEBUG: getAuthenticatedUser ===");
            System.out.println("Spring Authentication: " + springAuth);
            System.out.println("Is Authenticated: " + (springAuth != null && springAuth.isAuthenticated()));
            System.out.println("Is Anonymous: " + (springAuth instanceof AnonymousAuthenticationToken));
            System.out.println("Principal Type: " + (springAuth != null ? springAuth.getPrincipal().getClass().getSimpleName() : "null"));
            System.out.println("Principal: " + (springAuth != null ? springAuth.getPrincipal() : "null"));
            
            // Check if it's an anonymous authentication
            if (springAuth instanceof AnonymousAuthenticationToken) {
                System.out.println("User is anonymous - not authenticated");
                return null;
            }
            
            return authContext.getAuthenticatedUser(OidcUser.class)
                .map(oidcUser -> {
                    System.out.println("OIDC User found: " + oidcUser.getEmail());
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
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * Check if the current user is authenticated
     * This is the safest method to check auth status
     */
    @AnonymousAllowed
    public boolean isAuthenticated() {
        try {
            // Debug logging
            Authentication springAuth = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("=== DEBUG: isAuthenticated ===");
            System.out.println("Spring Authentication: " + springAuth);
            System.out.println("Is Authenticated: " + (springAuth != null && springAuth.isAuthenticated()));
            System.out.println("Is Anonymous: " + (springAuth instanceof AnonymousAuthenticationToken));
            System.out.println("Principal Type: " + (springAuth != null ? springAuth.getPrincipal().getClass().getSimpleName() : "null"));
            
            // Check if it's an anonymous authentication
            if (springAuth instanceof AnonymousAuthenticationToken) {
                System.out.println("User is anonymous - not authenticated");
                return false;
            }
            
            boolean isAuth = authContext.getAuthenticatedUser(OidcUser.class).isPresent();
            System.out.println("AuthContext has OIDC User: " + isAuth);
            System.out.println("=== DEBUG: isAuthenticated COMPLETE ===");
            
            return isAuth;
        } catch (Exception e) {
            // Log the error but don't throw
            System.err.println("Error checking authentication: " + e.getMessage());
            e.printStackTrace();
            System.out.println("=== DEBUG: isAuthenticated ERROR ===");
            return false;
        }
    }
    
    /**
     * Get user profile information (requires authentication)
     * This method should only be called when you're sure the user is authenticated
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