package com.howell.examvault.base.security;

import java.io.IOException;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import com.vaadin.flow.spring.security.VaadinWebSecurity;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@EnableWebSecurity
@Configuration
public class SecurityConfiguration extends VaadinWebSecurity {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        
        // Apply Vaadin's default security configuration
        super.configure(http);
        
        // Configure OAuth2 login
        http.oauth2Login(oauth2 -> oauth2
            .loginPage("/login")
            .defaultSuccessUrl("/home", false)
            .failureUrl("/login?error=true")
            .successHandler(new OAuth2AuthenticationSuccessHandler())
            .failureHandler(new OAuth2AuthenticationFailureHandler())
        );
        
        // Configure logout
        http.logout(logout -> logout
            .logoutRequestMatcher(new AntPathRequestMatcher("/logout"))
            .logoutSuccessUrl("/")
            .invalidateHttpSession(true)
            .deleteCookies("JSESSIONID")
            .clearAuthentication(true)
        );
            
        System.out.println("=== Security Configuration Complete ===");
    }

    /**
     * Custom success handler for OAuth2 authentication
     */
    private static class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {
        
        @Override
        public void onAuthenticationSuccess(
                HttpServletRequest request, 
                HttpServletResponse response, 
                Authentication authentication) throws IOException, ServletException {
            
            try {
                // Check if there's a saved redirect path in the session
                String redirectPath = (String) request.getSession().getAttribute("redirectPath");
                if (redirectPath != null && !redirectPath.equals("/login") && !redirectPath.equals("/")) {
                    request.getSession().removeAttribute("redirectPath");
                    System.out.println("Redirecting to saved path: " + redirectPath);
                    response.sendRedirect(redirectPath);
                } else {
                    System.out.println("No saved path, redirecting to home dashboard");
                    response.sendRedirect("/home");
                }
            } catch (IOException e) {
                System.err.println("Error during redirect after successful authentication: " + e.getMessage());
                // Fallback redirect
                response.sendRedirect("/home");
            }
        }
    }

    /**
     * Custom failure handler for OAuth2 authentication
     */
    private static class OAuth2AuthenticationFailureHandler implements AuthenticationFailureHandler {
        
        @Override
        public void onAuthenticationFailure(
                HttpServletRequest request, 
                HttpServletResponse response, 
                AuthenticationException exception) throws IOException, ServletException {
                        
            try {
                // Clear any potentially problematic session data
                if (request.getSession(false) != null) {
                    request.getSession().removeAttribute("redirectPath");
                }
                
                // Redirect to login with error parameter
                response.sendRedirect("/login?error=true");
            } catch (IOException e) {
                System.err.println("Error during redirect after failed authentication: " + e.getMessage());
                // If redirect fails, try to send an error response
                if (!response.isCommitted()) {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Authentication failed");
                }
            }
        }
    }
}