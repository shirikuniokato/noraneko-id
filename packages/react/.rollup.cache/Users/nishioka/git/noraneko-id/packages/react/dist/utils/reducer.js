/**
 * NoranekoID State Reducer
 */
/**
 * 初期状態
 */
export const initialState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitializing: true,
    error: null,
};
/**
 * 状態管理用Reducer
 *
 * 認証状態の変更を一元的に管理
 */
export function noranekoIDReducer(state, action) {
    switch (action.type) {
        case 'INITIALIZE_START':
            return {
                ...state,
                isInitializing: true,
                isLoading: true,
                error: null,
            };
        case 'INITIALIZE_SUCCESS':
            return {
                ...state,
                isInitializing: false,
                isLoading: false,
                error: null,
            };
        case 'INITIALIZE_ERROR':
            return {
                ...state,
                isInitializing: false,
                isLoading: false,
                error: action.payload,
            };
        case 'AUTH_START':
            return {
                ...state,
                isLoading: true,
                error: null,
            };
        case 'AUTH_SUCCESS':
            return {
                ...state,
                user: action.payload,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            };
        case 'AUTH_ERROR':
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload,
            };
        case 'LOGOUT_START':
            return {
                ...state,
                isLoading: true,
                error: null,
            };
        case 'LOGOUT_SUCCESS':
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            };
        case 'LOGOUT_ERROR':
            return {
                ...state,
                isLoading: false,
                error: action.payload,
            };
        case 'USER_UPDATE':
            return {
                ...state,
                user: action.payload,
                isAuthenticated: action.payload !== null,
            };
        case 'TOKEN_REFRESH_START':
            return {
                ...state,
                isLoading: true,
                error: null,
            };
        case 'TOKEN_REFRESH_SUCCESS':
            return {
                ...state,
                isLoading: false,
                error: null,
            };
        case 'TOKEN_REFRESH_ERROR':
            return {
                ...state,
                isLoading: false,
                error: action.payload,
            };
        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null,
            };
        case 'SET_LOADING':
            return {
                ...state,
                isLoading: action.payload,
            };
        default:
            return state;
    }
}
//# sourceMappingURL=reducer.js.map