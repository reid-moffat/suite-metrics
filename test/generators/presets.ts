import { SuiteStructure } from "./options.ts";

const realisticStructure: SuiteStructure[] = [
    {
        suitePath: ["Authentication"],
        tests: ["login", "logout", "password_reset"],
        subSuites: [
            {
                suitePath: ["Authentication", "OAuth"],
                tests: ["google_login", "github_login"],
            },
            {
                suitePath: ["Authentication", "TwoFactor"],
                tests: ["sms_verification", "app_verification"],
            }
        ]
    },
    {
        suitePath: ["API"],
        tests: ["health_check"],
        subSuites: [
            {
                suitePath: ["API", "Users"],
                tests: ["create_user", "get_user", "update_user", "delete_user"],
                subSuites: [
                    {
                        suitePath: ["API", "Users", "Validation"],
                        tests: ["email_validation", "password_strength"],
                    }
                ]
            },
            {
                suitePath: ["API", "Posts"],
                tests: ["create_post", "get_posts", "update_post"],
            }
        ]
    },
    {
        suitePath: ["Frontend"],
        tests: ["page_load"],
        subSuites: [
            {
                suitePath: ["Frontend", "Components"],
                tests: ["button_click", "form_submission", "modal_display"],
            },
            {
                suitePath: ["Frontend", "Navigation"],
                tests: ["menu_navigation", "breadcrumb_display"],
            }
        ]
    }
];

const edgeCaseStructure: SuiteStructure[] = [
    // Suite with special characters
    {
        suitePath: ["Suite with spaces & symbols!@#$%^&*()"],
        tests: ["Test with spaces", "Test!@#$%^&*()"],
    },
    // Suite with unicode characters
    {
        suitePath: ["测试套件 🧪 тест"],
        tests: ["测试 🧪", "тест"],
    },
    // Very long names
    {
        suitePath: ["A".repeat(1000)],
        tests: ["B".repeat(10_000)],
    },
    // Numeric-looking names
    {
        suitePath: ["0", "1"],
        tests: ["2", "3"],
    },
    // Whitespace names (but not empty)
    {
        suitePath: ["   ", "\t\n "],
        tests: [" test ", "\ttest\n"],
    },
    // Case sensitivity tests
    {
        suitePath: ["CaseSuite"],
        tests: ["TestName", "testname", "TESTNAME"],
    }
];

export { realisticStructure, edgeCaseStructure };
