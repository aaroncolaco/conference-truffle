'use strict';

const conferenceContract = artifacts.require("Conference");

contract('Conference', (accounts) => {

  const account_zero = accounts[0];
  const account_one = accounts[1];

  let contractInstance = null;

  // before hook; set contract instance
  before(() => {
    conferenceContract.deployed()
      .then(instance => {
        contractInstance = instance;
      });
  });

  describe('check initial contract state', () => {
    it("should have quota `500`", () => {
      return contractInstance.quota()
        .then(quota => {
          assert.equal(quota, 500, 'did not return quota `500`');
        });
    });

    it("should have numRegistrants `0`", () => {
      return contractInstance.numRegistrants()
        .then(numRegistrants => {
          assert.equal(numRegistrants, 0, 'did not return numRegistrants `0`');
        });
    });

    it("should have correct organizer", () => {
      return contractInstance.organizer()
        .then(organizerAccount => {
          assert.equal(organizerAccount, account_zero, 'did not return organizer ' + account_zero);
        });
    });

    it("should have balance `0`", () => {
      return contractInstance.getBalance()
        .then(balance => {
          assert.equal(balance, 0, 'did not have balance `0`');
        });
    });
  });

  describe('check ticket purchase', () => {
    it("should return `true` on ticket purchase", () => {
      return contractInstance.buyTicket.call({ value: 20, from: account_one })  // using `call()` so that we can get return value. Otherwise returns Tx object
        .then((returnValue) => {
          assert.equal(returnValue, true, 'did not return `true` on ticket purchase');
        });
    });

    it("should emit `Deposit` event on ticket purchase", () => {
      return contractInstance.buyTicket({ value: 20, from: account_one })
        .then((transaction) => {
          assert.equal(transaction.logs[0].event, 'Deposit', 'did not emit a `Deposit` event');
        });
    });

    it("should record amount paid for ticket purchased", () => {
      return contractInstance.registrantsPaid(account_one)
        .then(amountPaid => {
          assert.equal(amountPaid, 20, 'did not record ticket purchase amount correctly');
        });
    });

    it("should have balance `20`", () => {
      return contractInstance.getBalance()
        .then(balance => {
          assert.equal(balance, 20, 'did not have balance `20`');
        });
    });

    it("should increment `numRegistrants`", () => {
      return contractInstance.numRegistrants.call()
        .then((numRegistrants) => {
          assert.equal(numRegistrants, 1, 'did not increment `numRegistrants` after purchase');
        });
    });

  });

  describe('check quota update', () => {
    it("should allow owner to update quota", () => {
      return contractInstance.changeQuota(650)
        .then(transaction => contractInstance.quota.call())
        .then(quota => {
          assert.equal(quota, 650, 'did not update quota');
        });
    });
    it("should not allow non owner to update quota", () => {
      return contractInstance.changeQuota(700, { from: account_one })
        .then(transaction => contractInstance.quota.call())
        .then(quota => {
          assert.equal(quota, 650, 'non owner updated quota');
        });
    });
  });

  describe('check refund', () => {
    it("should not allow non owner to refund partial amount", () => {
      return contractInstance.refundTicket(account_one, 10, { from: account_one })
        .then(transaction => contractInstance.registrantsPaid(account_one))
        .then(amount => {
          assert.equal(amount, 20, 'should not have refunded amount');
          return contractInstance.getBalance();
        })
        .then(balance => {
          assert.equal(balance, `20`, 'should have balance `20`');
        });
    });
    it("should not allow non owner to refund full amount", () => {
      return contractInstance.refundTicket(account_one, 20, { from: account_one })
        .then(transaction => contractInstance.registrantsPaid(account_one))
        .then(amount => {
          assert.equal(amount, 20, 'should not have refunded amount');
          return contractInstance.getBalance();
        })
        .then(balance => {
          assert.equal(balance, `20`, 'should have balance `20`');
        });
    });

    it("should not allow organizer(owner) to refund partial amount", () => {
      return contractInstance.refundTicket(account_one, 10)
        .then(transaction => contractInstance.registrantsPaid(account_one))
        .then(amountPaid => {
          assert.equal(amountPaid, 20, 'should not have refunded partial amount');
          return contractInstance.getBalance();
        })
        .then(balance => {
          assert.equal(balance, `20`, 'should have balance `20`');
        });
    });

    it("should allow organizer to refund full amount", () => {
      return contractInstance.refundTicket(account_one, 20)
        .then(transaction => contractInstance.registrantsPaid(account_one))
        .then(amountPaid => {
          assert.equal(amountPaid, 0, 'should have refunded full amount');
          return contractInstance.getBalance();
        })
        .then(balance => {
          assert.equal(balance, `0`, 'should have balance `0`');
        });
    });
  });
});
