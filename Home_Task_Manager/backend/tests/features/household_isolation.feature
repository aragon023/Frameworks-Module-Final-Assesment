Feature: Household isolation

  Scenario: Authenticated user only sees tasks in their own household
    Given two households exist
    And a user in household A is authenticated
    And tasks exist in both households
    When the user requests the tasks list
    Then only household A tasks are returned
