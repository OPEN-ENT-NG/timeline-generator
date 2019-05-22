import { model, moment, ng, http } from 'entcore'

declare let $: any;

export const datePickerTimeline = ng.directive('datePickerTimeline', ($compile) => {
    return {
        scope: {
            ngModel: '=',
            ngChange: '&',
            minDate: '=',
            past: '=',
            expObject: '=',
            exp: '=',
            eventDateFormat: '='
        },
        transclude: true,
        replace: true,
        restrict: 'E',
        template: '<input ng-transclude type="text" data-date-format="dd/mm/yyyy"  />',
        link: function($scope, $element, $attributes){
            console.log((model as any).momentDateFormat);
            if ($scope.eventDateFormat == 'year') {
                var datePickerFormat = 'yyyy';
                var viewMode = "years";
                var minViewMode = "years";
            } else if ($scope.eventDateFormat == 'month') {
                var datePickerFormat = 'mm/yyyy';
                var viewMode = "months";
                var minViewMode = "months";
            } else if ($scope.eventDateFormat == 'day') {
                var datePickerFormat = 'dd/mm/yyyy';
                var viewMode = 'days';
                var minViewMode = 'days';
            }
            $scope.$watch('ngModel', function(newVal){
                if($element.is(':focus')){
                    return;
                }
                if ($scope.ngModel === undefined || $scope.ngModel === null) {
                    $scope.ngModel = moment().startOf('day');
                }
                $element.val($scope.ngModel.format((model as any).momentDateFormat[$scope.eventDateFormat]));
            });
            http().get('/infra/public/js/bootstrap-datepicker.js').done(function(){
                $element.datepicker({
                        dates: {
                            months: moment.months(),
                            monthsShort: moment.monthsShort(),
                            days: moment.weekdays(),
                            daysShort: moment.weekdaysShort(),
                            daysMin: moment.weekdaysMin()
                        },
                        format: datePickerFormat,
                        viewMode: viewMode,
                        minViewMode: minViewMode
                    })
                    .on('changeDate', function(){
                        setTimeout(function(){
                            var newMoment = moment($element.val(), (model as any).momentDateFormat[$scope.eventDateFormat]);
                            $scope.ngModel = newMoment;
                            $scope.$apply('ngModel');
                            $scope.$parent.$eval($scope.ngChange);
                            $scope.$parent.$apply();
                        }, 10);

                        $(this).datepicker('hide');
                    });
                $element.datepicker('hide');
            });

            $element.on('focus', function(){
                var that = this;
                $(this).parents('form').on('submit', function(){
                    $(that).datepicker('hide');
                });
                $element.datepicker('show');
            });

            $element.on('change', function(){
                var newMoment = moment($element.val(), (model as any).momentDateFormat[$scope.eventDateFormat]);
                $scope.ngModel = newMoment;
                var elementValue = $scope.ngModel.format((model as any).momentDateFormat[$scope.eventDateFormat]);
                $element.datepicker('setValue', elementValue);
                $scope.$apply('ngModel');
                $scope.$parent.$eval($scope.ngChange);
                $scope.$parent.$apply();
            });

            $element.on('remove', function() {
                if($element.datepicker)
                    $element.datepicker('remove');
            });
        }
    };
});
