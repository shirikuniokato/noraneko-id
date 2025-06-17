// Build-time discovery types
// Runtime discovery functionality has been moved to build-time (next.config.js)

export interface DiscoveryDocument {
  // Required
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  jwks_uri: string
  response_types_supported: string[]
  subject_types_supported: string[]
  id_token_signing_alg_values_supported: string[]
  
  // Recommended
  userinfo_endpoint?: string
  registration_endpoint?: string
  scopes_supported?: string[]
  claims_supported?: string[]
  
  // Optional
  revocation_endpoint?: string
  introspection_endpoint?: string
  code_challenge_methods_supported?: string[]
  grant_types_supported?: string[]
  token_endpoint_auth_methods_supported?: string[]
  end_session_endpoint?: string
}